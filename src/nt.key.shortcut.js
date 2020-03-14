"use strict";


let nt_prevent_shortcut =[ "Ctrl+B", "Ctrl+I", "Ctrl+U", "Ctrl+Y", "Ctrl+Delete", "Ctrl+Backspace"];



function OnKeydownForShortcut(event) {
    if(event.isComposing){ 
        console.log("cancel for composing");
        return;
    }
    
    
    if (event.getModifierState("Control") || event.getModifierState("Meta")){
        let shortcut_key = "";
        if(nt_is_MacOS){
            shortcut_key += (event.getModifierState("Meta") ? "Ctrl+" : "");
        }else{
            shortcut_key += (event.getModifierState("Control") ? "Ctrl+" : "");        
        }
        shortcut_key += (event.getModifierState("Shift") ? "Shift+" : "");
        shortcut_key += (event.key.length===1) ? event.key.toUpperCase() : event.key;
        //NOTE: in the EDGE(Legacy), when the Control is true, event.key is always lower case even if Shift is true."
            
        console.log(shortcut_key);
                
        switch(shortcut_key){
        case "Ctrl+Z":
            {
                event.preventDefault();
                NT_Dispatch("undo");            
                
            }
            break;
        case "Ctrl+Shift+Z":
            { 
                event.preventDefault();
                NT_Dispatch("redo");               
            
            }
            break;
        case "Ctrl+A":
            {
                console.log("ctrl + a");                
                //SelectAll(event.currentTarget);
                event.preventDefault();
                NT_Dispatch("selectall");
                        
            }
            break;
            
        default:
            {
                
                if(nt_prevent_shortcut.includes(shortcut_key)){    
                    console.log("prevent: default short cut");                      
                    event.preventDefault();
                }else{
                    console.log("through: default short cut");  
                }
            }
        }
    } else {            
        if (event.key === "F2") {

            PrintFocus();
            console.log("Undo history: " + undo_man.numHistory);
            
            event.preventDefault();
            return ;
        }
    }
}

