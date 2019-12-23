const REQUEST_ROLL_CONFIG = [
    {
        module : "request_roll",
        key: "enableDcResolve",
        settings : {
            name : "Enabled automatic DC resolve",
            hint : "Automatically checks to see if the DC succeeds and displays the margin",
            scope : "world",
            config : true,
            default : true,
            type : Boolean,
            choices : undefined 
        }
    },
    {
        module : "request_roll",
        key: "ownedVsActive",
        settings : {
            name : "Display Owned Tokens over Active",
            hint : "When selecting players display all user owned tokens (opposed to only currently active).",
            scope : "world",
            config : true,
            default : false,
            type : Boolean,
            choices : undefined 
        }
    }   
]