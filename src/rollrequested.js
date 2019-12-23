class RollRequested extends FormApplication {
    constructor(...args){
        super(...args);
        this.SOCKET = "module.request_roll"
        this.data;
        this.characters;
        this.portraits;
        this.counter = 0;
        this.advantage;
        this._initSocket();
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "modules/request_roll/templates/requested_roll.html";
        options.width = 650;
        options.height = "auto";
        options.title = "Roll Requested!"
        options.closeOnSubmit = false;
        options.id = "roll-requested-container"
        return options;
    }

    async getData() {
        const templateData = {
            characters: this.portraits,
            attributes: this.data.attributes,
            skills: this.data.skills,
            saves: this.data.saves,
            advantage: this.advantage
        }
        return templateData;
    }

    activateListeners(html) {
        super.activateListeners(html);

        $(document).ready(function(){
            $('#player-container img:not(:first)').addClass('not-selected')
            $('.roll-content').hide();
            $('.roll-content:first').show();
        });

        $(".player-portrait").click(function() {
            let id = $(this).attr('id');
            if($(this).hasClass("not-selected"))
            {
                $('#player-container img').addClass('not-selected');
                $('#player-container img').removeClass('active');
                $(this).removeClass("not-selected");
                $(this).addClass("active")
                $('.roll-content').hide();
                $('#' + id + 'C').insertAfter($('.roll-content:last'));
                $('#' + id + 'C').fadeIn('slow');
            }
        });

        $(".clickable-roll").click(this._onRoll.bind(this));
    }

    _onRoll(event){
        event.preventDefault();
        $(event.target).prop('disabled', true)
        let id = $(event.target).attr('id');
        let pid = $(event.target).parent().attr('id');
        let parts = id.split('-');
        let modResult = 0;
        let character = this.characters.filter(function(character){
            return character.actor === pid;
        })
        let label = "";
        switch(parts[0]){
            case "attribute":
                modResult = game.actors.get(character[0].actor).data.data.abilities[parts[1]].mod;
                label = `${CONFIG.DND5E.abilities[parts[1]]} ability check`;
                break;
            case "save":
                modResult = game.actors.get(character[0].actor).data.data.abilities[parts[1]].save;
                label = `${CONFIG.DND5E.abilities[parts[1]]} saving throw`;
                break;
            case "skill":
                modResult = game.actors.get(character[0].actor).data.data.skills[parts[1]].mod;
                label = `${CONFIG.DND5E.skills[parts[1]]} skill check`;
                break;
        }
        $(event.target).parent().hide(1000);
        this._roll(this.data.modifiers.advantage, {mod : modResult, bonus: this.data.modifiers.bonus}, label, label, character[0], this.data.modifiers.hidden, this.data.modifiers.dc);
    }

    async handleData(data){
        this.data = data;
        await this._updateCharacters();
        if(this._handleCounter())
            return;
        await this._handleAdvantage();
        this.render(true);
    }

    async _updateCharacters(){
        this.characters = [];
        this.portraits = [];
        this.data.characters.forEach(async character =>{
            let image = await game.actors.get(character).getTokenImages();
            this.portraits.push({img : image, id: character});
            let actorData = {
                actor: character,
                alias: game.actors.get(character).data.name,
                scene: game.scenes.active.id
            }
            this.characters.push(actorData);
        });
    }

    _handleCounter(){
        this.counter += this.portraits.length * (this.data.attributes.length + this.data.skills.length + this.data.saves.length); 
        if(this.counter == 0)
            return true;
    }

    async _handleAdvantage(){
        switch(this.data.modifiers.advantage){
            case 0:
                this.advantage = "";
                break;
            case 1:
                this.advantage = " at advantage!";
                break;
            case -1:
                this.advantage = " at disadvantage";
                break;
        }
    }

    _roll = (adv, data, title, flavor, speaker, hidden, dc) => {
        let rollMode = (hidden == 1) ? "blindroll" : "roll";
        let parts = ["1d20", "@mod", "@bonus"] 
        if (adv === 1) {
          parts[0] = ["2d20kh"];
          flavor = `${title} (Advantage)`;
        }
        else if (adv === -1) {
          parts[0] = ["2d20kl"];
          flavor = `${title} (Disadvantage)`;
        }
        if(game.settings.get('request_roll', 'enableDcResolve'))
            parts[0] += `ms>=${dc}`;

        // Don't include situational bonus unless it is defined
        if (!data.bonus && parts.indexOf("@bonus") !== -1) parts.pop();
  
        // Execute the roll
        let roll = new Roll(parts.join(" + "), data).roll();
  
        // Flag critical thresholds
        let d20 = roll.parts[0];
        d20.options.critical = 20;
        d20.options.fumble = 1;
        
        // Convert the roll to a chat message
        roll.toMessage({
          speaker: speaker,
          flavor: flavor,
          rollMode: rollMode
        });
        if(--this.counter == 0)
            this.close();
    };

    _initSocket(){
        game.socket.on("module.request_roll", packet => {
            if(game.user.id === packet.userId){
                this.handleData(packet);
            }
        });
    }
}

Handlebars.registerHelper('request-roll-ability', function(ability){
    return CONFIG.DND5E["abilities"][ability]
});

Handlebars.registerHelper('request-roll-skill', function(skill){
    return CONFIG.DND5E["skills"][skill]
});

Hooks.on('ready', ()=>{
    let ps = new RollRequested();
})
