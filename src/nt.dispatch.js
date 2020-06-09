"use strict";

function NT_Dispatch(type){
    switch(type){
        case "undo":
        {
            let highlight_word = null;
            if(IsHighlightMode()){                        
                highlight_word = nt_highlight.Word;
                NT_HighlightClear();                        
            }

            ExecUndo();
            console.log("finish undo");            
                    
            if(highlight_word){
                NT_HighlightWord(highlight_word);
            }

        }
        break;
        case "redo":
        {
            let highlight_word = null;
            if(IsHighlightMode()){                        
                highlight_word = nt_highlight.Word;
                NT_HighlightClear();                        
            }
            
            ExecRedo();
            console.log("finish redo");
                                
            if(highlight_word){
                NT_HighlightWord(highlight_word);
            }
        }
        break;
        case "selectall":
        {
            SelectAll(nt_render_div);
            console.log("finish select all");
        }
        break;    
        case "findforward":
        {
            if(nt_finding_word.length>0){
                NT_FindAndSelect(nt_finding_word);
            }
        }
        break;
        case "findbackward":
        {
            if(nt_finding_word.length>0){
                NT_FindBackwardAndSelect(nt_finding_word);
            }        
        }
        break;
    }
}
