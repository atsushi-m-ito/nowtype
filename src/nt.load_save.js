"use strict";

function NT_SetMarkdown(md_text){

    console.log("md_text:\n",md_text)
    console.log("clear all elements")
    
    const maindiv = nt_render_div;
    while(maindiv.firstChild){
        maindiv.removeChild(maindiv.firstChild);
    }

    
    console.log("create dom")
    
    const fragment = MD2DOM(md_text);
    InitializeMathInFragment(fragment, g_auto_numbering ? 1 : 0);
    
    console.log("set DOM")
    
    maindiv.appendChild(fragment);

    //Undo reset//
    undo_man = new UndoManager();
    undo_man.SetChangeEventDispatcher(new ChangeEventDispatcher(render_div));
    
    console.log("fin: load");
    
}

function NT_GetMarkdown(){
    return DOM2MD(nt_render_div);     
}

let nt_file_dir = "";
function NT_SetFilePath(path){
    
    if (path.charAt(path.length-1) ==='/'){
        nt_file_dir = path;
        
    }else if (path.charAt(path.length-1) ==='\\'){
        nt_file_dir = path;
        
    }else if(path.slice(path.length-3)===".md"){
        let pos = path.lastIndexOf('/');
        if(pos < 0){
            pos = path.lastIndexOf('\\');
            if(pos < 0){
                nt_file_dir="";
            }
        }
        nt_file_dir = path.slice(0, pos+1);
        
    }else{
        let pos = path.lastIndexOf('/');
        if(pos >= 0){
            nt_file_dir = path + "/";
        }
        nt_file_dir = path + "\\";
    }
    
    console.log("SetFilePath:", nt_file_dir);
}

