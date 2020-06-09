"use strict";

let FF_IME_node_origin = null;
let FF_IME_offset = 0;
let FF_IME_length = 0;
let FF_IME_original_text = null;


let FF_IME_br_origin = null;
let FF_IME_parent = null;
let FF_IME_offset_in_parent = 0;

//let FF_IME_not_by_Henkan = false;
let FF_IME_update_count = 0;
let FF_IME_in_action = false;
let FF_IME_text_preceding_convert = null;
let FF_IME_node_preceding_convert = null;

let FF_IME_is_connected_undo = false;


function RefineFocusToText(focus_node, focus_offset){
    const ch = focus_node.childNodes.item(focus_offset);
    if(ch){
        if(ch.nodeType===Node.TEXT_NODE){
            focus_node = ch;
            focus_offset = 0;
        }
    }else{
        const back = focus_node.childNodes.item(focus_offset-1);
        if(back){
            if(back.nodeType===Node.TEXT_NODE){
                focus_node = back;
                focus_offset = focus_node.length;
            }
        }
    }

    return [focus_node, focus_offset];
}


function FF_OnCompositionstart(event){
    FF_IME_in_action = true;
    console.log("compositionstart: ", event.data);

    //br is automatically removed by IME input.
    //then original br is kept before input IME//
    const selection = document.getSelection();
    if(selection.rangeCount === 0){event.currentTarget.blur();return false;}
   

    const range = selection.getRangeAt(0);    
    let focus_node = range.startContainer;
    let focus_offset = range.startOffset;
    let anchor_node = range.endContainer;
    let anchor_offset = range.endOffset;
    
    if(focus_node.nodeType!==Node.TEXT_NODE){
        [focus_node, focus_offset] = RefineFocusToText(focus_node, focus_offset);
    }
    if(anchor_node.nodeType!==Node.TEXT_NODE){
        [anchor_node, anchor_offset] = RefineFocusToText(anchor_node, anchor_offset);
    }
    
  
    //const is_collapsed = selection.isCollapsed;
    FF_IME_is_connected_undo = false;
    
    console.log("focus: ", focus_node,  focus_offset); 
    if((focus_node!==anchor_node) || (focus_offset !== anchor_offset )){
        console.log("anchor: ", anchor_node,  anchor_offset);
    }

    

    if(selection.isCollapsed){
        FF_IME_node_origin = focus_node;
        FF_IME_offset = focus_offset;
        FF_IME_length = 0;
        FF_IME_original_text = null;
        

        if(focus_node.nodeName==="BR"){
            FF_IME_br_origin = focus_node;
            FF_IME_parent = focus_node.parentNode;
            FF_IME_offset_in_parent = GetIndex(focus_node.parentNode, focus_node);

            console.log("keep original BR node");
        }else if(focus_node.hasChildNodes()){
            const ch = focus_node.childNodes.item(focus_offset);
            if(ch.nodeName==="BR"){
                FF_IME_br_origin = ch;
                FF_IME_parent = focus_node;
                FF_IME_offset_in_parent = focus_offset;

                console.log("keep original BR node");
            }else if(ch.nodeType===Node.TEXT_NODE){
                console.log("WARNING: focus is at parent of text");
                focus_node = ch;
                focus_offset = 0;
            }
        } 
        
        if(focus_node.nodeType === Node.TEXT_NODE){

            console.log("IME is input on text:", focus_node.data);

            // continuous text nodes are combined to avoid IME error//
            let p = focus_node.nextSibling;
            while(p){
                if(p.nodeType!==Node.TEXT_NODE){break;}
                p = p.nextSibling;
            }
            const first_not_text = p;
            
            const is_combined = (focus_node.nextSibling===first_not_text) ? false : true;
            if(is_combined){
                    
                undo_man.Begin(focus_node, focus_offset);
                while(focus_node.nextSibling!==first_not_text){
                    CombineTextNode(focus_node);                    
                }
                undo_man.End(focus_node, focus_offset);
                
                FF_IME_is_connected_undo = true;
                console.log("combine_text: ", focus_node.data);
            }
            ////////////////////////combined//
                
            FF_IME_node_origin = focus_node;
            FF_IME_offset = focus_offset;
            FF_IME_original_text = focus_node.data;
            FF_IME_length = FF_IME_original_text.length;
            FF_IME_parent = focus_node.parentNode;
            FF_IME_offset_in_parent = GetIndex(focus_node.parentNode, focus_node);
        }
        
    }else{// not colappsed
        let de_selection = false;
        FF_IME_node_origin = focus_node;
        FF_IME_offset = focus_offset;
        FF_IME_original_text = null;

        if(anchor_node.nodeType === Node.TEXT_NODE){
            
            if(focus_node === anchor_node){
                //change into the case that collapse and by Henkan key//
                FF_IME_node_origin = focus_node;
                FF_IME_offset = focus_offset;
                FF_IME_original_text = focus_node.data;                    
                FF_IME_length = FF_IME_original_text.length;
                FF_IME_parent = focus_node.parentNode;
                FF_IME_offset_in_parent = GetIndex(focus_node.parentNode, focus_node);
                de_selection = true;

            }else if(focus_node.nodeType === Node.TEXT_NODE){
                let is_only_text = true;
                let p = focus_node.nextSibling;
                while(p!==anchor_node){
                    if(p===null){is_only_text = false; break;}
                    if(p.nodeType!==Node.TEXT_NODE){is_only_text = false; break;}
                    p = p.nextSibling;
                }
                if(is_only_text){
                    undo_man.Begin(focus_node, focus_offset, anchor_node, anchor_offset);
                    let a_offset = 0;
                    while(focus_node.nextSibling!==anchor_node){
                        CombineTextNode(focus_node);
                    }
                    anchor_offset = focus_node.length + anchor_offset;
                    CombineTextNode(focus_node);                    
                    selection.setBaseAndExtent(focus_node,focus_offset, focus_node, anchor_offset);
                    undo_man.End(focus_node, focus_offset, focus_node, anchor_offset);
                    
                    FF_IME_node_origin = focus_node;
                    FF_IME_offset = focus_offset;
                    FF_IME_original_text = focus_node.data;
                    FF_IME_length = FF_IME_original_text.length;
                    FF_IME_parent = focus_node.parentNode;
                    FF_IME_offset_in_parent = GetIndex(focus_node.parentNode, focus_node);
                    de_selection = true;
                    FF_IME_is_connected_undo = true;
                    console.log("combine_text: ", FF_IME_original_text);

                }
            }

        }

        const IME_TEST0214A=true;
        if(IME_TEST0214A){
            if(!de_selection){
                {
                    const [fnode, foffset] = CorrectFocusToText(focus_node, focus_offset);
                    selection.collapse(fnode, foffset);
                    FF_IME_node_origin = fnode;
                    FF_IME_offset = foffset;
                    FF_IME_original_text = fnode.data;                    
                    FF_IME_length = FF_IME_original_text.length;
                    FF_IME_parent = fnode.parentNode;
                    FF_IME_offset_in_parent = GetIndex(fnode.parentNode, fnode);
                    de_selection = true;
                }
            }
        }

        if(!de_selection){
            console.log("Cancel IME")
           
            //cancel IME input//            
            event.preventDefault();
            //event.stopImmediatePropagation();
            event.currentTarget.blur();
            selection.removeAllRanges();
            //alert("IME is cancelled to avoid bug"); 
            //!!!!This alert is very important to vanish IME subwindow on Chrome!!!!//
            
            
        }
        
    }

    console.log("FF_IME_original_text: ", FF_IME_original_text);
    if(FF_IME_node_preceding_convert){
        if((FF_IME_node_origin !== FF_IME_node_preceding_convert ) || 
            (FF_IME_node_origin.data !== FF_IME_text_preceding_convert.data) ){
            console.log("WARNING by Chrome bug: FF_IME_text_before  : ",FF_IME_text_preceding_convert);
            FF_IME_original_text = FF_IME_text_preceding_convert;
            FF_IME_node_origin = FF_IME_node_preceding_convert;
            FF_IME_length = FF_IME_original_text.length;

        /*} else if(FF_IME_node_origin.data !== FF_IME_text_preceding_convert.data){
            console.log("WARNING by Chrome bug: FF_IME_text_before  : ",FF_IME_text_preceding_convert);
            FF_IME_original_text = FF_IME_text_preceding_convert;
            FF_IME_length = FF_IME_original_text.length;
        */
        }
    }
    FF_IME_node_preceding_convert = null;
    FF_IME_text_preceding_convert = null;

    FF_IME_update_count = 0;
    
    //FF_IME_not_by_Henkan = false;
}


function FF_OnCompositionupdate(event){
    const subtext = event.data;
    console.log("composition update: ", subtext.length);
    
    const act_node = document.activeElement;
    console.log("active_element:", act_node, act_node.selectionStart, act_node.selectionEnd );

    const selection = document.getSelection();
    const focus_node = selection.focusNode;
    const focus_offset = selection.focusOffset;
    console.log("focus: ", focus_node, focus_offset);
    if(focus_node.nodeType===Node.TEXT_NODE){
        console.log("text: ", focus_node.data);
    }
    const anchor_node = selection.anchorNode;
    const anchor_offset = selection.anchorOffset;
    if((focus_node!==anchor_node) || (focus_offset !== anchor_offset )){
        console.log("anchor: ", anchor_node,  anchor_offset);
    }
    ////////////////////////////just for log///

    
    /*

    if(FF_IME_update_count===0) {
        if(focus_node.nodeType!==Node.TEXT_NODE){
            console.log("ERROR: IME first update is not focusing text node");
            event.currentTarget.blur();
            selection.removeAllRanges();
            return;
        }

        //to judge which the IME is simple input or re-translation by "Henkan" key//
        
        if(event.data.length === 1){
            if((focus_node.length - FF_IME_length) === 1){
                FF_IME_not_by_Henkan = true;
            }            
        }

        if(FF_IME_not_by_Henkan){
            console.log("IME by simple input");
        }else{
            
            console.log("IME by Henkan key");
            
        }
                
    }
*/

    FF_IME_update_count++;
/*
    if(FF_IME_node_origin !== focus_node){
        console.log("node is changed: ");
        //FF_IME_node_origin = focus_node;
        if(focus_node.nodeType!==Node.TEXT_NODE){
            console.log("node become to be not text");            
        }
    }
*/
    //console.log("FF_IME_original_text: ", FF_IME_original_text);
    
}


function FF_OnCompositionend(event){
    const subtext = event.data;
    console.log("compositionend: ", subtext.length);
    //console.log("FF_IME_original_text: ", FF_IME_original_text);
    
    
    const FF_IME_ResetParams = ()=>{
        FF_IME_br_origin = null;
        FF_IME_node_origin = null;
        FF_IME_offset = 0;
        FF_IME_length = 0;
        FF_IME_original_text = null;
        FF_IME_in_action = false;
    };

    /*
    if(FF_IME_null===0){
        console.log("IME input is cancel: case 3 (no update)");
        FF_IME_ResetParams();
        return;
    }
    */

    const selection = document.getSelection();
    if(selection.rangeCount===0){
        console.log("IME input is cancel: case 4 (by focus blur)");
        FF_IME_ResetParams();
        return;
    }

    let focus_node = document.getSelection().focusNode;
    let focus_offset = document.getSelection().focusOffset;
    if(focus_node.nodeType!==Node.TEXT_NODE){
        [focus_node, focus_offset] = RefineFocusToText(focus_node, focus_offset);
    }
    
    
    {//just for log////////////////////////
        console.log("focus: ", focus_node, focus_offset);
        if(focus_node.nodeType===Node.TEXT_NODE){
            console.log("text: ", focus_node.data);
        }
        const anchor_node = document.getSelection().anchorNode;
        const anchor_offset = document.getSelection().anchorOffset;
        if((focus_node!==anchor_node) || (focus_offset !== anchor_offset )){
            console.log("anchor: ", anchor_node,  anchor_offset);
        }
    
    }////////////////////////just for log//
    


    
    if(FF_IME_node_origin===null){
        console.log("IME input is cancel: case 6 (FF_IME_node_origin is null)");
        FF_IME_ResetParams();
        return;
    }
    
    

    if(FF_IME_is_connected_undo){
        //in future, the Undo history is connected with 
        //the previous "CombineText" operation in OnCompositionstart//
    }


    {
        
        if(FF_IME_original_text){
            if((focus_node.nodeType !== Node.TEXT_NODE) || 
                (focus_node!==FF_IME_parent.childNodes.item(FF_IME_offset_in_parent))){
                    
                console.log("all text restarted by Henkan key is deteled.");
                console.log("node:",FF_IME_node_origin);

                FF_IME_node_origin.data = FF_IME_original_text;
                undo_man.Begin(FF_IME_node_origin, FF_IME_node_origin.length);
                undo_man.Register(UR_TYPE.REMOVE_NODE, FF_IME_node_origin, FF_IME_parent, FF_IME_offset_in_parent, 1);
                if(FF_IME_offset_in_parent===0){
                    if(!FF_IME_parent.hasChildNodes()){
                        AddNode("BR", FF_IME_parent, FF_IME_parent.firstChild);
                        console.log("add BR in P/H1/LI tag");  
                    }else{
                        if(FF_IME_parent.firstChild.nodeName==="BR"){
                            undo_man.Register(UR_TYPE.ADD_NODE, FF_IME_parent.firstChild, FF_IME_parent, FF_IME_offset_in_parent, 1);
        
                            console.log("br was automatically added by IME, here we only register");  
        
                        }else if(FF_IME_parent.nodeName==="LI"){
                            if((FF_IME_parent.firstChild.nodeName === "OL")||
                            (FF_IME_parent.firstChild.nodeName === "UL")){
                                AddNode("BR", FF_IME_parent, FF_IME_parent.firstChild);
                                console.log("add BR before child OL/UL in LI tag");  
                            }
                        }
                    }
                }         
                
                
                if(FF_IME_parent.nodeName==="P"){
                    if(IsSpanMathImg(FF_IME_parent.firstChild)){
                        const figure = ConvertPtoFigure(FF_IME_parent);

                        const focus = EnableMathEdit(figure.firstChild, 2);
                        document.getSelection().collapse(focus.node, focus.foffset);
                        undo_man.End(focus.node, focus.foffset);
                        
                        FF_IME_ResetParams();
                        return;
                    }
                }

                undo_man.End(focus_node, focus_offset);
                
                FF_IME_ResetParams();
                return;
                
            }else if(focus_node !== FF_IME_node_origin){
                console.log("IME input node is changed by browser engine");
                undo_man.Begin(FF_IME_node_origin, FF_IME_node_origin.length);
                FF_IME_node_origin.data = FF_IME_original_text;
                undo_man.Register(UR_TYPE.REMOVE_NODE, FF_IME_node_origin, FF_IME_parent, FF_IME_offset_in_parent, 1);
                undo_man.Register(UR_TYPE.ADD_NODE, focus_node, FF_IME_parent, FF_IME_offset_in_parent, 1);
                undo_man.End(focus_node, focus_offset);
                
                FF_IME_ResetParams();
                return;
            
            }else if(focus_node.data === FF_IME_original_text){
                console.log("IME input is cancel: case 2 (updated but not changed)");
                FF_IME_ResetParams();
                return;
            
            }else {

                const width = focus_node.length - FF_IME_length;
                if(width === event.data.length){
                    // simple input (not by Henkan key)//                    

                    const text = FF_IME_node_origin.data.slice(FF_IME_offset, FF_IME_offset + width);
                    console.log("IME input text" , text);
                    
                    if(IsTextNodeInMath(FF_IME_node_origin)){
                        if((FF_IME_offset===0) || (FF_IME_offset === FF_IME_length )){
                            
                            FF_IME_node_origin.deleteData(FF_IME_offset, width);
                            SwitchInputChar(text, FF_IME_node_origin, FF_IME_offset);
                        }else{
                            const margin = GetEditMargin(FF_IME_node_origin.parentNode.parentNode);
                            if((FF_IME_offset < margin)||(FF_IME_node_origin.length - margin < FF_IME_offset + width)){
                                FF_IME_node_origin.deleteData(FF_IME_offset, width);//cancel input//
                                console.log("IME input is cancel: case 5 (within the begin/end mark for math like node)");
                                FF_IME_ResetParams();
                                return;
                            }else{        
                                //we must check special characters     
                                console.log("regarded, insert into math like text");   

                                undo_man.Begin(FF_IME_node_origin,FF_IME_offset);
                                undo_man.Register(UR_TYPE.INSERT_TEXT_INTO_TEXT, text, FF_IME_node_origin, FF_IME_offset, width);
                                undo_man.End(FF_IME_node_origin,FF_IME_offset + width);
                            }
                        }
                    }else{ //as plain text//
                            
                        console.log("regarded, insert into plain text");
                    
                        undo_man.Begin(FF_IME_node_origin,FF_IME_offset);
                        undo_man.Register(UR_TYPE.INSERT_TEXT_INTO_TEXT, text, FF_IME_node_origin, FF_IME_offset, width);
                        undo_man.End(FF_IME_node_origin,FF_IME_offset + width);
                        
                    }
                }else{ // (restarted by Henkan key) //
                    console.log("regarded, replace all text data in the node");
                
                    undo_man.Begin(FF_IME_node_origin, FF_IME_offset);
                    undo_man.Register(UR_TYPE.DELETE_IN_TEXT, FF_IME_original_text, FF_IME_node_origin, 0, FF_IME_original_text.length);
                    undo_man.Register(UR_TYPE.INSERT_TEXT_INTO_TEXT, FF_IME_node_origin.data, FF_IME_node_origin, 0, FF_IME_node_origin.length);
                    undo_man.End(focus_node, focus_offset);
                }
            }
        }else {// (!FF_IME_original_text)
            
            
            if(focus_node.nodeType !== Node.TEXT_NODE){
                console.log("IME input is cancel (case 1): new node is added and but removed.");
                    
                if(FF_IME_br_origin){ 
                    const new_br = FF_IME_parent.childNodes.item(FF_IME_offset_in_parent);
                    if((new_br !==null) && (new_br !== FF_IME_br_origin)){
                        FF_IME_parent.insertBefore(FF_IME_br_origin, new_br);
                        FF_IME_parent.removeChild(new_br);
                        selection.collapse(FF_IME_parent, FF_IME_offset_in_parent);                
    
                        console.log("br is revived.");
                    }
                }
            }else{
                
                const width =focus_node.length;
                const text = focus_node.data;//.slice(FF_IME_offset, FF_IME_offset + width);
                console.log("IME input text", text);
                console.log("regarded, add text");
                
                undo_man.Begin(FF_IME_parent, FF_IME_offset_in_parent);
                if(FF_IME_br_origin){
                    if(FF_IME_br_origin.parentNode !== FF_IME_parent){
                        undo_man.Register(UR_TYPE.REMOVE_NODE, FF_IME_br_origin, FF_IME_parent, FF_IME_offset_in_parent, 1);
                    }
                }
                undo_man.Register(UR_TYPE.ADD_TEXT_NODE, focus_node, focus_node.parentNode, GetIndex(focus_node.parentNode,focus_node), width);
                if(FF_IME_br_origin){
                    if(focus_node.nextSibling===FF_IME_br_origin){
                        RemoveNode(FF_IME_br_origin);
                    }
                }
                undo_man.End(focus_node, width);
            }
            
        }
    }


    FF_IME_ResetParams();
}



/*
key lock to suppress that focus moves out of IME region
*/
function FF_OnKeydownForIME(event){
    if(FF_IME_in_action){
        switch(event.key){
            case "ArrowLeft":
            case "ArrowRight":
            case "ArrowUp":
            case "ArrowDown":
            case "PageUp":
            case "PageDown":
            case "Home":
            case "End":
                event.preventDefault();
                event.stopImmediatePropagation();
            break;
        }        
        
    }else{
        if(event.key==="Process"){
        
            if(event.code==="Convert"){
                console.log("catch Convert key before compositionstart: ",event.key, event.code);
                const selection = document.getSelection();
                const focus_node = selection.focusNode;
                if(focus_node.nodeType===Node.TEXT_NODE){
                    console.log("Text before composition: ", focus_node.data);
                    FF_IME_node_preceding_convert = focus_node;
                    FF_IME_text_preceding_convert = focus_node.data;
                }
            }
        }
    }

}


function FF_OnContextmenuForIME(event){
    if(FF_IME_in_action){
        console.log("contextmenu: ");
        event.preventDefault();
        event.stopImmediatePropagation();
    }
}

