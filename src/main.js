class RequestRoll extends Application {

    /**
     * Define default options for the PartySummary application
     */
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "modules/request_roll/templates/hello.html";
        options.width = 750;
        options.height = "auto";
        return options;
    }

    /* -------------------------------------------- */

    /**
     * Return the data used to render the summary template
     * Get all the active users
     * The impersonated character for each player is available as user.character
     */
        async getData() {
            let users = game.users.entities.filter(u => u.active)
            let z = await users[1].character.getTokenImages();
            const templateData = {
                name: "Edgar",
                mood: "curious",
                knowEverything: false,
                items: [z, z, z],
                attribute: CONFIG.DND5E["abilities"],
                skill: CONFIG.DND5E["skills"]
            }
              
            return templateData;
        }

    /* -------------------------------------------- */

    /**
     * Add some event listeners to the UI to provide interactivity
     * Let's have the game highlight each player's token when their name is clicked on
     */
    activateListeners(html) {

        html.find(".player-item").click(ev => {
            ev.preventDefault();
            console.log("HEY!");
        })
    }
}

Hooks.on('ready', ()=>{
    let ps = new RequestRoll();
    ps.render(true);
})

  