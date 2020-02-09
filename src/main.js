class RequestRoll extends FormApplication {
    constructor(...args){
        super(...args);
        this.SOCKET = "module.request_roll"
        this._showDM = false;
        this._selected = [];
        this._attributes = [];
        this._saves = [];
        this._skills = [];
        this.commonUsage = {
            pos : ["+2", "+5"],
            neg : ["-2", "-5"]
        }

        this.owned = game.settings.get('request_roll', 'ownedVsActive');   
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
            items: await this.setPortraits(),
            attribute: CONFIG.DND5E["abilities"],
            skill: CONFIG.DND5E["skills"]
        }
            
        return templateData;
    }
 
    sendPackets(packets){
        packets.forEach(packet => {
            game.socket.emit("module.request_roll", packet, resp => { // Adjust playerRef
                console.log("SENT");
            });
        })
    }

    _updateObject(event, formData) {
        let sortedData = this._sortData(formData);
        let packetsToBeSent = this._seperatePackets(sortedData);
        this.sendPackets(packetsToBeSent);
    }

    _seperatePackets(sortedData){
        let players = this._determineNecessaryPlayers(sortedData);
        let data = this._determineNecessaryOther(sortedData);
        let modifiers = this._determineNecessaryModifiers(sortedData);
        return this._generatePacket(players, data, modifiers)
    }

    _generatePacket(players, data, modifiers){
        let listofPackets = []
        for(const [key, value] of Object.entries(players)){
            if(value.length != 0)
            {
                listofPackets.push({
                    userId: key,
                    characters: value,
                    attributes: data.attributes,
                    skills: data.skills,
                    saves: data.saves,
                    modifiers: modifiers
                });
            }

        }
        return listofPackets;
    }

    _determineNecessaryModifiers(data){
        let packet = {'mod': 0, 'bonus': 0, 'dc': 0, 'advantage': 0, 'hidden': data.modifiers.hidden}
        const numberConverter = {
            'one' : 0,
            'two' : 1
        }
        for(let [key, value] of Object.entries(data.modifiers)){
            if(key.includes('common') && value == true){
                let tempKey = key;
                tempKey = tempKey.replace("common-", "");
                let index = numberConverter[tempKey.substring(0,3)];
                let sign = tempKey.substring(tempKey.length-3, tempKey.length);
                let result = parseInt(this.commonUsage[sign][index]);
                packet['bonus'] += result;
            }
            else if(key == "advantage" && value != false){
                packet[key] += 1;
            }
            else if(key == "disadvantage" && value != false){
                packet['advantage'] += -1;
            }
            else if(key == "bonus"){
                    if(isNaN(value)){
                        ui.notifications.error("Roll Request: Invalid input in 'Modifiers' section. Defaulting to 0");
                    }
                    value = parseInt(value) || 0;
                    packet[key] += parseInt(value);
            }
            else if(key == "dc"){
                if(isNaN(value)){
                    ui.notifications.error("Roll Request: Invalid input in 'dc' section. Defaulting to 10");
                }
                value = parseInt(value) || 10;
                packet[key] += parseInt(value);
            } 
        }
        return packet;
    }


    _determineNecessaryPlayers(data){
        let packet = {};
        for(const [key, value] of Object.entries(data.players)){
            if(value == true){
                let parts = key.split('.');
                if(packet[parts[0]] == undefined){
                    packet[parts[0]] = [];
                }
                packet[parts[0]].push(parts[1]);
            }
        }  
        return packet;
    }



    _determineNecessaryOther(data){
        let packet = {'attributes': [], "skills": [], "saves": []}
        for(const [parentKey, parentValue] of Object.entries(data)){
            if(parentKey != "players" && parentKey != "modifiers"){
                for(let [key, value] of Object.entries(parentValue)){
                    if(value != false){
                        packet[parentKey].push(key);
                    }
                }
            } 
        }
        return packet;
    }

    _sortData(formData){
        let players = this._filter(formData, "player");
        let attributes = this._filter(formData, "attribute");
        let skills = this._filter(formData, "skill");
        let saves = this._filter(formData, "save");
        let modifiers = this._filter(formData, "modifier");
        return {
            "players": players,
            "attributes": attributes,
            "skills": skills,
            "saves" : saves,
            "modifiers":  modifiers
        };
    }

    _filter(formData, wordReq){
        let dict = {};
        let keys = Object.keys(formData).filter(word => word.includes(wordReq) == true);
        keys.forEach(key => {
            if(wordReq == "player" || wordReq == "modifier")
                dict[key.replace((wordReq+"-"), "")] = formData[key];
            else{
                if(key.includes("Performance"))
                    dict['prf'] = formData[key];
                else if( key.includes("Perception"))
                    dict['prc'] = formData[key];
                else if(key.includes('Sleight'))
                    dict['slt'] = formData[key];
                else
                    dict[(key.replace((wordReq+"-"), "")).substring(0,3).toLowerCase()] = formData[key];
            }
        })
        return dict;
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


    async setPortraits(){
        let userSet = this._determineUserSize();
        let informationField = this._determineOwnedOrActive(userSet);
        return informationField;
    }

    _determineUserSize(){
        let users = game.users.entities
        let userSet = [];
        users.forEach(user => {
            if(!user.isGM || this._showDM)
                userSet.push(user)
        });
        return userSet;
    }

    _determineOwnedOrActive(userSet){
        if(this.owned)
            return this._owned(userSet);
        else
            return this._active(userSet);
    }

    _active(userSet){
        let informationField = []
        userSet.forEach(user => {
            let image = user.character.img; 
            informationField.push({
                img: image, 
                id: user.id +'.' + user.character.id
            });
        });
        return informationField;
    }

    _owned(userSet){
        let informationField = []
        userSet.forEach(async user => {
            let actors = game.actors.entities.filter(actor => actor.hasPerm(user, "OWNER"))
            actors.forEach(async actor => {
                let image = await actor.getTokenImages(); 
                informationField.push({
                    img: image, 
                    id: user.id + '.' + actor.id
                });
            });
        });
        return informationField;
    }
}


/* Refer to line 16945 in foundry.js */
Hooks.on('getSceneControlButtons', function(info){
    let area = info.find(val => {
        return val.name == "token";
    })
    
    if(area)
        area.tools.push({
            name: "request_roll",
            title: "Request Roll",
            icon: "fas fa-dice-d20",
            visible: game.user.isGM,
            onClick: () => (new RequestRoll()).render(true)
        });

})

Hooks.on('init', () => {
    REQUEST_ROLL_CONFIG.forEach(function(setting){
        game.settings.register(setting.module, setting.key, setting.settings);
    });
})
