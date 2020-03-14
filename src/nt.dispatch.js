"use strict";

function NT_Dispatch(type){
    switch(type){
        case "undo":
            ExecUndo();
            console.log("finish undo");
            break;
        case "redo":
            ExecRedo();
            console.log("finish redo");
            break;
        case "selectall":
            SelectAll(nt_render_div);
            console.log("finish select all");
            break;    
    }
}
