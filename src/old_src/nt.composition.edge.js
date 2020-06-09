"use strict";

let EDGE_IME_node = null;
let EDGE_IME_node_origin = null;
let EDGE_IME_offset = 0;
let EDGE_IME_length = 0;
let EDGE_IME_original_text = null;


let EDGE_IME_br_origin = null;
let EDGE_IME_parent = null;
let EDGE_IME_offset_in_parent = 0;

let EDGE_IME_not_by_Henkan = false;
let EDGE_IME_update_count = 0;
let EDGE_IME_in_action = false;

let EDGE_IME_is_connected_undo = false;


function EDGE_OnCompositionstart(event){
    EDGE_IME_in_action = true;
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
    /*
    let focus_node = document.getSelection().focusNode;
    let focus_offset = document.getSelection().focusOffset;
    let anchor_node = document.getSelection().anchorNode;    
    let anchor_offset = document.getSelection().anchorOffset;
    */
    
  
    //const is_collapsed = selection.isCollapsed;
    EDGE_IME_is_connected_undo = false;
    
    console.log("focus: ", focus_node,  focus_offset); 
    if((focus_node!==anchor_node) || (focus_offset !== anchor_offset )){
        console.log("anchor: ", anchor_node,  anchor_offset);
    }

    if(selection.isCollapsed){
        EDGE_IME_node = null;
        EDGE_IME_offset = 0;
        EDGE_IME_length = 0;
        EDGE_IME_original_text = null;
        

        if(focus_node.nodeName==="BR"){
            EDGE_IME_br_origin = focus_node;
            EDGE_IME_parent = focus_node.parentNode;
            EDGE_IME_offset_in_parent = GetIndex(focus_node.parentNode, focus_node);

            console.log("keep original BR node");
        }else if(focus_node.hasChildNodes()){
            const ch = focus_node.childNodes.item(focus_offset);
            if(ch.nodeName==="BR"){
                EDGE_IME_br_origin = ch;
                EDGE_IME_parent = focus_node;
                EDGE_IME_offset_in_parent = focus_offset;

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
                
                EDGE_IME_is_connected_undo = true;
                console.log("combine_text: ", focus_node.data);
            }
            ////////////////////////combined//
                
            EDGE_IME_node = focus_node;
            EDGE_IME_offset = focus_offset;
            EDGE_IME_original_text = focus_node.data;
            EDGE_IME_length = EDGE_IME_original_text.length;
            EDGE_IME_parent = focus_node.parentNode;
            EDGE_IME_offset_in_parent = GetIndex(focus_node.parentNode, focus_node);
        }
        
    }else{// not colappsed
        let de_selection = false;
        EDGE_IME_node = null;
        EDGE_IME_offset = 0;
        EDGE_IME_original_text = null;

        if(anchor_node.nodeType === Node.TEXT_NODE){
            
            if(focus_node === anchor_node){
                //change into the case that collapse and by Henkan key//
                EDGE_IME_node = focus_node;
                EDGE_IME_offset = focus_offset;
                EDGE_IME_original_text = focus_node.data;                    
                EDGE_IME_length = EDGE_IME_original_text.length;
                EDGE_IME_parent = focus_node.parentNode;
                EDGE_IME_offset_in_parent = GetIndex(focus_node.parentNode, focus_node);
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
                    
                    EDGE_IME_node = focus_node;
                    EDGE_IME_offset = focus_offset;
                    EDGE_IME_original_text = focus_node.data;
                    EDGE_IME_length = EDGE_IME_original_text.length;
                    EDGE_IME_parent = focus_node.parentNode;
                    EDGE_IME_offset_in_parent = GetIndex(focus_node.parentNode, focus_node);
                    de_selection = true;
                    EDGE_IME_is_connected_undo = true;
                    console.log("combine_text: ", EDGE_IME_original_text);

                }
            }

        }

        if(!de_selection){
            //cancel IME input//            
            event.currentTarget.blur();
            selection.removeAllRanges();
            //selection.collapse(focus_node,focus_offset);
            event.stopImmediatePropagation();
            
        }
        
    }

    EDGE_IME_node_origin = EDGE_IME_node;
    EDGE_IME_update_count = 0;
    EDGE_IME_not_by_Henkan = false;
}


function EDGE_OnCompositionupdate(event){
    const subtext = event.data;
    console.log("composition update: ", subtext.length);
    
    
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

    
    

    if(EDGE_IME_update_count===0) {
        if(focus_node.nodeType===Node.TEXT_NODE){         

            //to judge which the IME is simple input or re-translation by "Henkan" key//
            
            if(event.data.length === 1){
                if((focus_node.length - EDGE_IME_length) === 1){
                    EDGE_IME_not_by_Henkan = true;
                }            
            }

            if(EDGE_IME_not_by_Henkan){
                console.log("IME by simple input");
            }else{
                
                console.log("IME by Henkan key");
                
            }
        }
    }
    EDGE_IME_update_count++;


    if(EDGE_IME_node !== focus_node){
        console.log("node is changed: ");
        
        if(focus_node.nodeType===Node.TEXT_NODE){
            EDGE_IME_node = focus_node;
        }else{
            console.log("node become to be not text");            
        }
    }

    
}


function EDGE_OnCompositionend(event){
    const subtext = event.data;
    console.log("compositionend: ", subtext.length);

    
    const EDGE_IME_ResetParams = ()=>{
        EDGE_IME_br_origin = null;
        EDGE_IME_node = null;
        EDGE_IME_node_origin = null;
        EDGE_IME_offset = 0;
        EDGE_IME_length = 0;
        EDGE_IME_original_text = null;
        EDGE_IME_in_action = false;
        EDGE_IME_not_by_Henkan = false;
    };

    /*
    if(EDGE_IME_null===0){
        console.log("IME input is cancel: case 3 (no update)");
        EDGE_IME_ResetParams();
        return;
    }
    */

    const selection = document.getSelection();
    if(selection.rangeCount===0){
        console.log("IME input is cancel: case 4 (by focus blur)");
        EDGE_IME_ResetParams();
        return;
    }

    const focus_node = document.getSelection().focusNode;
    const focus_offset = document.getSelection().focusOffset;
    
    
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
    

        
    
    if(EDGE_IME_node===null){
        console.log("IME input is cancel: case 6 (EDGE_IME_node is null)");
        EDGE_IME_ResetParams();
        return;
    }
    
    

    if(EDGE_IME_is_connected_undo){
        //in future, the Undo history is connected with 
        //the previous "CombineText" operation in OnCompositionstart//
    }


    {
        
        if(EDGE_IME_original_text){
            if(EDGE_IME_node.nodeType !== Node.TEXT_NODE){
                alert("ERROR: unexpected case in IME input");
                EDGE_IME_ResetParams();
                return;
            }else if(EDGE_IME_node.parentNode===null){
                if(EDGE_IME_not_by_Henkan){
                    alert("ERROR: input node type is not TEXT");
                    EDGE_IME_ResetParams();
                    return;
                }
    
                console.log("all text restarted by Henkan key is deteled.");
                console.log("node:",EDGE_IME_node_origin);
    
                EDGE_IME_node_origin.data = EDGE_IME_original_text;
                undo_man.Begin(EDGE_IME_node_origin, EDGE_IME_node_origin.length);
                undo_man.Register(UR_TYPE.REMOVE_NODE, EDGE_IME_node_origin, EDGE_IME_parent, EDGE_IME_offset_in_parent, 1);
    
                let is_need_new_br = false;
                if(EDGE_IME_offset_in_parent===0){
                    if(!EDGE_IME_parent.hasChildNodes()){                        
                        AddNode("BR", EDGE_IME_parent, EDGE_IME_parent.firstChild);   
                        console.log("add BR in P/H1/LI tag");  
                    }else{
                        if(EDGE_IME_parent.firstChild.nodeName==="BR"){
                            //undo_man.Register(UR_TYPE.ADD_NODE, EDGE_IME_parent.firstChild, EDGE_IME_parent, EDGE_IME_offset_in_parent, 1);

                            console.log("br was automatically added by IME, here we only register");  

                        }else if(EDGE_IME_parent.nodeName==="LI"){
                            if((EDGE_IME_parent.firstChild.nodeName === "OL")||
                            (EDGE_IME_parent.firstChild.nodeName === "UL")){
                                AddNode("BR", EDGE_IME_parent, EDGE_IME_parent.firstChild);   
                                console.log("add BR before child OL/UL in LI tag");  
                            }
                        }                
                    }
                }

                if(EDGE_IME_parent.nodeName==="P"){
                    if(IsSpanMathImg(EDGE_IME_parent.firstChild)){
                        const figure = ConvertPtoFigure(EDGE_IME_parent);

                        const focus = EnableMathEdit(figure.firstChild, 2);
                        document.getSelection().collapse(focus.node, focus.foffset);
                        undo_man.End(focus.node, focus.foffset);                        

                        EDGE_IME_ResetParams();
                        return;
                    }
                }
                
                undo_man.End(focus_node, focus_offset);
                
                EDGE_IME_ResetParams();
                return;
            }else if(EDGE_IME_node_origin !== EDGE_IME_node){
                console.log("IME input node is changed by browser engine");
                undo_man.Begin(EDGE_IME_node_origin, EDGE_IME_offset);
                EDGE_IME_node_origin.data = EDGE_IME_original_text;
                undo_man.Register(UR_TYPE.REMOVE_NODE, EDGE_IME_node_origin, EDGE_IME_parent, EDGE_IME_offset_in_parent, 1);
                undo_man.Register(UR_TYPE.ADD_TEXT_NODE, EDGE_IME_node, EDGE_IME_node.parentNode, GetIndex(EDGE_IME_node.parentNode,EDGE_IME_node), 1);
                undo_man.End(focus_node, focus_offset);
                EDGE_IME_ResetParams();
                return;
            
            }else if(EDGE_IME_node.data===EDGE_IME_original_text){
                console.log("IME input is cancel: case 2 (updated but not changed)");
                EDGE_IME_ResetParams();
                return;
            
            }else if(EDGE_IME_not_by_Henkan){
                const width = EDGE_IME_node.length - EDGE_IME_length;
                const text = EDGE_IME_node.data.slice(EDGE_IME_offset, EDGE_IME_offset + width);
                console.log("IME input text" , text);
                    
                if(IsTextNodeInMath(EDGE_IME_node)){
                    if((EDGE_IME_offset===0) || (EDGE_IME_offset === EDGE_IME_length )){
                        
                        EDGE_IME_node.deleteData(EDGE_IME_offset, width);
                        SwitchInputChar(text, EDGE_IME_node, EDGE_IME_offset);
                    }else{
                        const margin = GetEditMargin(EDGE_IME_node.parentNode.parentNode);
                        if((EDGE_IME_offset < margin)||(EDGE_IME_node.length - margin < EDGE_IME_offset + width)){
                            EDGE_IME_node.deleteData(EDGE_IME_offset, width);//cancel input//
                            console.log("IME input is cancel: case 5 (within the begin/end mark for math like node)");
                            EDGE_IME_ResetParams();
                            return;
                        }else{        
                            //we must check special characters     
                            console.log("regarded, insert into math like text");   
                            if(EDGE_IME_node_origin!==EDGE_IME_node){
                                alert("ERROR: unexpected node replace");
                            }

                            undo_man.Begin(EDGE_IME_node,EDGE_IME_offset);
                            undo_man.Register(UR_TYPE.INSERT_TEXT_INTO_TEXT, text, EDGE_IME_node, EDGE_IME_offset, width);
                            undo_man.End(EDGE_IME_node,EDGE_IME_offset + width);
                        }
                    }
                }else{ //as plain text//
                        
                    console.log("regarded, insert into plain text");
                    if(EDGE_IME_node_origin!==EDGE_IME_node){
                        alert("ERROR: unexpected node replace");
                    }
                
                    console.log("Undo history: " + undo_man.numHistory);

                    undo_man.Begin(EDGE_IME_node,EDGE_IME_offset);
                    undo_man.Register(UR_TYPE.INSERT_TEXT_INTO_TEXT, text, EDGE_IME_node, EDGE_IME_offset, width);
                    undo_man.End(EDGE_IME_node,EDGE_IME_offset + width);
                    console.log("Undo history: " + undo_man.numHistory);
                }

            }else{ // (! EDGE_IME_not_by_Henkan) //
                console.log("regarded, replace all text data in the node");
                undo_man.Begin(EDGE_IME_node_origin, EDGE_IME_offset);
                undo_man.Register(UR_TYPE.DELETE_IN_TEXT, EDGE_IME_original_text, EDGE_IME_node, 0, EDGE_IME_original_text.length);
                undo_man.Register(UR_TYPE.INSERT_TEXT_INTO_TEXT, EDGE_IME_node.data, EDGE_IME_node, 0, EDGE_IME_node.length);
                undo_man.End(focus_node, focus_offset);
            }
        
        }else {// (!EDGE_IME_original_text)
            
            
            if(EDGE_IME_node.parentNode === null){
                console.log("IME input is cancel (case 1): new node is added and but removed.");
                    
                if(EDGE_IME_br_origin){ 
                    const new_br = EDGE_IME_parent.childNodes.item(EDGE_IME_offset_in_parent);
                    if((new_br !==null) && (new_br !== EDGE_IME_br_origin)){
                        EDGE_IME_parent.insertBefore(EDGE_IME_br_origin, new_br);
                        EDGE_IME_parent.removeChild(new_br);
                        selection.collapse(EDGE_IME_parent, EDGE_IME_offset_in_parent);                
    
                        console.log("br is revived.");
                    }
                }
            }else{
                
                const width =EDGE_IME_node.length;
                const text = EDGE_IME_node.data;//.slice(EDGE_IME_offset, EDGE_IME_offset + width);
                console.log("IME input text", text);
                console.log("regarded, add text");
                
                undo_man.Begin(EDGE_IME_parent, EDGE_IME_offset_in_parent);
                if(EDGE_IME_br_origin){
                    if(EDGE_IME_br_origin.parentNode !== EDGE_IME_parent){
                        undo_man.Register(UR_TYPE.REMOVE_NODE, EDGE_IME_br_origin, EDGE_IME_parent, EDGE_IME_offset_in_parent, 1);
                    }
                }
                undo_man.Register(UR_TYPE.ADD_TEXT_NODE, EDGE_IME_node, EDGE_IME_node.parentNode, GetIndex(EDGE_IME_node.parentNode,EDGE_IME_node), width);
                if(EDGE_IME_br_origin){
                    if(EDGE_IME_node.nextSibling===EDGE_IME_br_origin){
                        RemoveNode(EDGE_IME_br_origin);
                    }
                }
                undo_man.End(EDGE_IME_node, width);
            }
            
        }
    }


    EDGE_IME_ResetParams();
}



/*
key lock to suppress that focus moves out of IME region
*/
function EDGE_OnKeydownForIME(event){
    if(EDGE_IME_in_action){
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
            /*
            EDGE cannot catch
            default:
                console.log("catch composition: ",event.key, event.code);
            break;                
            */
        }        
        
    }
    
}


function EDGE_OnContextmenuForIME(event){
    if(EDGE_IME_in_action){
        console.log("contextmenu: ");
        event.preventDefault();
        event.stopImmediatePropagation();
    }
}

