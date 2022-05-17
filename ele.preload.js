
/*
window.MyIPCSend = ()=>{ 
    
    const {ipcRenderer} = require('electron');
    ipcRenderer.send("msg_render_to_main", "test");

}
*/

const {
    contextBridge,
    ipcRenderer
} = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    "api", {
        send: (channel, data) => {
            // whitelist channels
            const valid_channels = ["open_file_to_main","save_file_to_main","zoom","showcontextmenu","print_ready","file_updated"];
            if (valid_channels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        on: (channel, func) => {
            const valid_channels = ["open_success", "save_file","save_as","save_success","undo","redo","selectall","print_begin","print_end","showmarkdown","showhtml","showtex","changecss","mathnumbering","mathrefresh","spellcheck","find"];
            if (valid_channels.includes(channel)) {
                console.log("catch: ", channel);
                
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        }
    }
);

//console.log("do preload.js");
