class RollRequested extends FormApplication {
    constructor(...args){
        super(...args);
        this.SOCKET = "module.request_roll"
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
        /*
        const templateData = {
            items: await this._setPortraits(),
            attribute: CONFIG.DND5E["abilities"],
            skill: CONFIG.DND5E["skills"]
        }
            
        return templateData;
        */
    }

    activateListeners(html) {
        super.activateListeners(html);/*
        $(".player-portrait").click(function() {
            if($(this).hasClass("player-portrait"))
            {
                $(this).removeClass("player-portrait").addClass("player-portrait-selected");
            }
            else{
                $(this).removeClass("player-portrait-selected").addClass("player-portrait");
            }
            console.log("Hi");
            
            let userLookup = ev.currentTarget.getAttribute('src')

            game.socket.emit("module.request_roll", this.playerReference[userLookup], resp => {
                console.log("SENT");
            });
        }) */  
    }


    _initSocket(){
        game.socket.on("module.request_roll", user => {
            if(game.user.id == user){
                //Handle Other Application
            }
        });
    }



}