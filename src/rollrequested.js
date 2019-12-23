class RollRequested extends FormApplication {
    constructor(...args){
        super(...args);
        this.SOCKET = "module.request_roll"
        this.data;
        this.characters;
        this.portraits;
        this._initSocket();
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "modules/request_roll/templates/requested_roll.html";
        options.width = 750;
        options.height = "auto";
        options.title = "Roll Requested!"
        options.closeOnSubmit = false;
        options.id = "roll-requested-container"
        return options;
    }

    async getData() {
        console.log(this.data);
        const templateData = {
            characters: this.portraits,
            attributes: this.data.attributes,
            skills: this.data.skills,
            saves: this.data.saves,
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

        // Do a click fade for buttons https://api.jquery.com/hide/

    }

    _onRoll(event){
        event.preventDefault();
        $(event.target).prop('disabled', true)
        let id = $(event.target).attr('id');
        let pid = $(event.target).parent().attr('id');
        console.log(pid);
        let parts = id.split('-');
        let modResult = 0;
        let character = this.characters.filter(function(character){
            return character.actor === pid;
        })
        switch(parts[0]){
            case "attribute":
                modResult = game.actors.get(character[0].actor).data.data.abilities[parts[1]].mod;
                break;
            case "save":
                modResult = game.actors.get(character[0].actor).data.data.abilities[parts[1]].save;
                break;
            case "skill":
                modResult = game.actors.get(character[0].actor).data.data.skills[parts[1]].mod;
                break;
        }
        $(event.target).parent().hide(1000);
        this._roll(0, {mod : modResult, bonus: 0}, "Pls work", "Pls work", character[0]);
    }
    handleData(data){
        this.data = data;
        this._updateCharacters();
        this.render(true);
    }

    _updateCharacters(){
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

    _roll = (adv, data, title, flavor, speaker) => {
        let parts = ["1d20", "@mod", "@bonus"] 
        if (adv === 1) {
          parts[0] = ["2d20kh"];
          flavor = `${title} (Advantage)`;
        }
        else if (adv === -1) {
          parts[0] = ["2d20kl"];
          flavor = `${title} (Disadvantage)`;
        }
  
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
          rollMode: game.settings.get("core", "rollMode")
        });
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
    return CONFIG.DND5E["abilities"][ability];
});

Handlebars.registerHelper('request-roll-skill', function(skill){
    return CONFIG.DND5E["skills"][skill];
});

Hooks.on('ready', ()=>{
    


    let ps = new RollRequested();
})
