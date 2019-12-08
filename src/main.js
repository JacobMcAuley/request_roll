class RequestRoll extends Application {

    /**
     * Define default options for the PartySummary application
     */
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = "modules/request_roll/templates/hello.html";
        options.width = 600;
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
                attribute: ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"]
              }
              
            return templateData;
        }

    /* -------------------------------------------- */

    /**
     * Add some event listeners to the UI to provide interactivity
     * Let's have the game highlight each player's token when their name is clicked on
     */
    activateListeners(html) {

        html.find(".actor-name").click(ev => {
        ev.preventDefault();

        // Get the actor which was clicked and the active token(s) for that actor
        let actorId = ev.currentTarget.parentElement.getAttribute("data-actor-id"),
            actor = game.actors.get(actorId),
            tokens = actor.getActiveTokens(true);

        // Highlight active token(s) by triggering the token's mouse-over handler
        for ( let t of tokens ) {
            t._onMouseOver();
        }
        })
    }
}

Hooks.on('ready', ()=>{
    let ps = new RequestRoll();
    ps.render(true);
})

  