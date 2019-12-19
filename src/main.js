class RequestRoll extends FormApplication {
    constructor(...args){
        super(...args);
        this.SOCKET = "module.request_roll"
        this.playerReference = {};
        this._initSocket();
        this._selected = [];
        this._attributes = [];
        this._saves = [];
        this._skills = [];
        
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "modules/request_roll/templates/request_roll.html";
        options.width = 750;
        options.height = "auto";
        options.title = "Request Roll"
        options.closeOnSubmit = false;
        options.id = "roll-request-container"
        return options;
    }

    async getData() {
        const templateData = {
            items: await this._setPortraits(),
            attribute: CONFIG.DND5E["abilities"],
            skill: CONFIG.DND5E["skills"]
        }
            
        return templateData;
    }
 
    _updateObject(event, formData) {
        let userLookup = ev.currentTarget.getAttribute('src')

        game.socket.emit("module.request_roll", this.playerReference[userLookup], resp => {
            console.log("SENT");
        });
        console.log(formData);
    }


    activateListeners(html) {
        super.activateListeners(html);
        $(".player-portrait").click(function() {
            if($(this).hasClass("player-portrait"))
            {
                $(this).removeClass("player-portrait").addClass("player-portrait-selected");
            }
            else{
                $(this).removeClass("player-portrait-selected").addClass("player-portrait");
            }
        });
    }


    async _setPortraits(){
        let users = game.users.entities
        let userSet = [];
        let imageArray = []
        users.forEach(user => {
            if(!user.isGM)
                userSet.push(user)
        });

        userSet.forEach(async user => {
            let image = await user.character.getTokenImages(); 
            imageArray.push(image);
            this.playerReference[image] = user.id;
        });

        return imageArray;
    }

    _initSocket(){
        game.socket.on("module.request_roll", user => {
            if(game.user.id == user){
                //Handle Other Application
            }
        });
    }



}

Hooks.on('ready', ()=>{
    let ps = new RequestRoll();
    ps.render(true);
})

