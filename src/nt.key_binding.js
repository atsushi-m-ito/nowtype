"use strict";

const NT_LINK_DEFAULT_URL = "https://sample.url";
const NT_LINK_DEFAULT_TEXT = "PreviewWord";


function OnKeyup(event) {

    switch (event.key) {
        case "ArrowUp":
        case "ArrowDown":
        case "Home":
        case "End":
        case "PageUp":
        case "PageDown":
            {
                if(!CorrectSelectionEdgeTable()){
                    event.preventDefault();
                    return false;
                }

                const selection = document.getSelection();                
                console.log("keyup   fook: " + event.key + "focus: node=" + selection.focusNode.tagName + ", offset=" + selection.focusOffset);
                const focus_math = CheckEditPreview(event.currentTarget);
                console.log("focus_math",focus_math, g_editable_math);
                if(focus_math){
                    if(event.shiftKey){
                        document.getSelection().extend(focus_math.node,focus_math.offset);
                    }else{
                        document.getSelection().collapse(focus_math.node,focus_math.offset);
                    }
                }
            }
            break;
            /*
        case "ArrowLeft":
        case "ArrowRight":

            break;
            */
    }
}


function OnKeydownForNavigation(event) {
    if(event.isComposing){
        console.log("nothing to do for composing");
        return;
    }
    
    if(nt_selected_cell) {
        OnKeydownForNavigationTable(event);
        return;
    }
    
    console.log("keydown(Navi):", event.key);  
    
    
    //without special keys//
    const selection = document.getSelection();
    const [node,offset] = (selection.isCollapsed) ? CorrectFocusToText(selection.focusNode, selection.focusOffset)
         : [selection.focusNode, selection.focusOffset];
    

    switch (event.key) {        
        case "ArrowUp":
            {       
                
                const td = CheckNodeInTD(selection.focusNode, event.currentTarget);
                if(td){
                    console.log("keydown Up, td: ",td);
                    if(event.getModifierState("Shift")){
                        SetSelectTable(td,td);
                        event.preventDefault();
                    }else{
                        const res = SwitchInputArrowUp(td);
                        if(res){
                            event.preventDefault();                            
                        }
                    }
                }
            }
            break;       
        case "ArrowDown":
            {
                
                
                const td = CheckNodeInTD(selection.focusNode, event.currentTarget);
                if(td){
                    console.log("keydown Down, td: ",td);                    
                    if(event.getModifierState("Shift")){
                        SetSelectTable(td,td);
                        event.preventDefault();
                    }else{
                        const res = SwitchInputArrowDown(td);                        
                        if(res){
                            event.preventDefault();                            
                        }
                    }
                }
            }
            break;          
        case "ArrowLeft":
            {            
                const res = SwitchInputArrowLeft(node, offset, event.getModifierState("Shift"));
                if(res){
                    event.preventDefault();
                }
            }
            break;
        case "ArrowRight":
            {
                const res = SwitchInputArrowRight(node, offset, event.getModifierState("Shift"));
                if(res){
                    event.preventDefault();                
                }            
            }
            break;
        case "Enter":
            {
                console.log("keydown fook: " + event.key + "focus:" + offset);
                
                event.preventDefault();
                if(selection.focusNode){
                    if(selection.focusNode.scrollIntoView){
                        selection.focusNode.scrollIntoView({behavior: 'auto', block: 'nearest'});
                    }
                }

                if (selection.isCollapsed) {                    
                    SwitchInputEnter(node, offset, event.getModifierState("Shift"));
                }
                
            }
            break;
        case "Delete":
            {

                console.log("keydown fook: " + event.key + "focus:" + offset);

                event.preventDefault();
                if(selection.focusNode){
                    if(selection.focusNode.scrollIntoView){
                        selection.focusNode.scrollIntoView({behavior: 'auto', block: 'nearest'});
                    }
                }
                if (selection.isCollapsed) {
                    SwitchInputDelete(node, offset, event.getModifierState("Shift"));
                }else{   
                    CorrectSelectionEdgeTable();                 
                    CutSelection(event.currentTarget, selection);
                }
                
            }
            break;
        case "Backspace":
            {

                console.log("keydown fook: " + event.key + "focus:" + offset);

                event.preventDefault();
                if(selection.focusNode){
                    if(selection.focusNode.scrollIntoView){
                        selection.focusNode.scrollIntoView({behavior: 'auto', block: 'nearest'});
                    }
                }
                if (selection.isCollapsed) {
                    SwitchInputBackspace(node, offset, event.getModifierState("Shift"));
                } else{
                    CorrectSelectionEdgeTable();
                    CutSelection(event.currentTarget, selection);
                }
                

            }
            break;
        case "Tab":  //just for list
            {
                
                event.preventDefault();
                if(event.getModifierState("Shift")){
                    console.log("keydown fook: Shift + Tab, focus:" + offset); 
                    SwitchInputShiftTab(node, offset);   
                }else{
                    console.log("keydown fook: Tab, focus:" + offset);
                    SwitchInputTab(node, offset);
                }                
            }
            break;
        }

    return;
}

function OnKeydownForAsciiChar(event) {
    
    if (event.getModifierState("Control") ||
        event.getModifierState("Alt") ||
        event.getModifierState("Meta")) {
        return;
    }

    console.log("keydown(Ascii):", event.key);   
    if( TryInputAsciiChar(event.key)){        
        event.preventDefault();
    }
}

function TryInputAsciiChar(char) {
    if(nt_selected_cell) return false;
    
    //without special keys//
    const selection = document.getSelection();
    let [node,offset] = CorrectFocusToText(selection.focusNode, selection.focusOffset);
    

    switch (char) {        
        case '$':    // insert math node//
        case '`':    // insert inline code node//
        case '*':    // insert string and em node//
        case '_':    // insert string and em node//
        //case '[':    insert a and figure //
            {  // insert math node//

                
                if (selection.isCollapsed) {
                    SwitchInputMath(char, node, offset);
                }else{
                    const [anchor_node, anchor_offset] = CorrectFocusToText(selection.anchorNode, selection.anchorOffset);
                    SwitchInputMathSelection(char, node, offset, anchor_node, anchor_offset);
                }
                console.log("keydown: " + char + ", make math");
                return true;
            }
            break;            
        case ' ':
            {
                
                if (selection.isCollapsed) {
                    const res = SwitchInputSpace(node, offset);
                    if(!res){
                        SwitchInputChar(char, node, offset);                        
                    }
                    
                }
                return true;
            }
            break;
        case '|':
            {
                if (selection.isCollapsed) {
                    const res = SwitchInputBar(node, offset);
                    if(!res){
                        SwitchInputChar(char, node, offset);
                    }
                
                }
                
                return true;
            }
            break;
        case '^':
            {
                if (selection.isCollapsed) {
                    const res = SwitchInputHat(node, offset);
                    if(!res){
                        SwitchInputChar(char, node, offset);
                    }
                
                }
                return true;                
            }
            break;
        case '(':
            {
                if (selection.isCollapsed) {
                    const res = SwitchInputRoundBra(node, offset);
                    if(!res){
                        SwitchInputChar(char, node, offset);
                    }
                
                }
                return true;                
            }
            break;
        default:
            {
                console.log("keydown: " + char);

                // accept to input text//

                if(char){
                    if (char.length === 1) {                        

                        if (!selection.isCollapsed) {
                            CorrectSelectionEdgeTable();
                            CutSelection(event.currentTarget, selection);                            
                            [node,offset] = CorrectFocusToText(selection.focusNode, selection.focusOffset);
                        }
                        
                        SwitchInputChar(char, node, offset);
                    
                        return true;
                    }
                }
            }
            break;
    }//end of switch//

    return false;
}

function OnBeforeinputForAsciiChar(event){
    if(event.inputType==="insertText"){
        if(TryInputAsciiChar( event.data) ) {            
            event.preventDefault();
        }

    }
}

function SwitchInputChar(text, node, offset) {
    //return false;
    if (node === null) return false;
    
    
    
    if (node.nodeType === Node.TEXT_NODE) {

        
        if(IsTextNodeInMath(node)){
            //in the math//
            const math = node.parentNode.parentNode;
            const margin = GetEditMargin(math);                
            if(offset < margin) return true; //cannot input within mark//
            if(offset > node.length - margin) return  true; //cannot input within mark//
        
        }else if(node.data　== nt_ZWBR){
            undo_man.Begin(node, offset);
            InsertTextIntoText(text, node, 1);
            DeleteText(node, 0, 1);
            undo_man.End(node, text.length);
            document.getSelection().collapse(node, text.length);
            return true;    
        }
        
        //plain text or inside text of math//
        undo_man.Begin(node, offset);
        InsertTextIntoText(text, node, offset);
        undo_man.End(node, offset + text.length);
        document.getSelection().collapse(node, offset + text.length);
        
        return true;
    }


    switch (node.tagName) {
        case "P":
        case "LI":
        case "H1":
        case "H2":
        case "H3":
        case "H4":
        case "H5":
        case "H6":
        case "FIGCAPTION":
        case "TH":
        case "TD":
            {

                const num_children = node.childNodes.length;
                if(offset===0){
                    if(node.firstChild.nodeName==="BR"){
                        //remove dummy br node from empty p, li, h1//
                        const br_node = node.firstChild;
                        const is_br_end = (br_node)=>{
                            if(br_node.nextSibling===null)return true;
                            if((br_node.nextSibling.nodeName==="OL") || (br_node.nextSibling.nodeName==="UL"))return true;
                            return false;
                        };
                        if(is_br_end(br_node)){
                            undo_man.Begin(node, offset);
                            const new_node = AddTextNode(text, node, br_node);
                            RemoveNode(br_node);
                            undo_man.End(new_node, new_node.length);
                            document.getSelection().collapse(new_node, new_node.length);
                            return true;
                        }                        
                    }                    
                }
                
                if (offset > 0) {
                    let target = node.childNodes.item(offset - 1);
                    if (target.nodeType === Node.TEXT_NODE) {
                        
                        undo_man.Begin(target, target.length);
                        InsertTextIntoText(text, target, target.length);
                        undo_man.End(target, target.length);
                        document.getSelection().collapse(target, target.length);
                        
                        return false;
                    }
                }
                if (offset < num_children) {
                    let target = node.childNodes.item(offset);
                    if (target.nodeType === Node.TEXT_NODE) {

                        
                        undo_man.Begin(target, 0);
                        InsertTextIntoText(text, target, 0);
                        undo_man.End(target, text.length);
                        document.getSelection().collapse(target, text.length);
                        
                        return false;
                    }
                }
                
                
                undo_man.Begin(node, offset);
                let ref_node = node.childNodes.item(offset); //item() method return null when offset >= length.

                let text_node = AddTextNode(text, node, ref_node);
                if(IsSpanMathRef(ref_node)){
                    ConvertMathRefToCite(ref_node);
                }
                undo_man.End(text_node, text_node.length);
                document.getSelection().collapse(text_node, text_node.length);
                return true;
            }
            break;            
        default:
            alert("ERROR: InputChar at " + node.tagName);
            break;
    }
    return false;
    
}




function FillTdBr(tr, tag_name, num_column){
    while(tr.childNodes.length < num_column){
        const td = AddNode(tag_name, tr, null);
        AddNode("BR", td, null);
    }
}

function SwitchInputEnter(node, offset, is_shift) {
    if (node === null) return true;
    

    let already_begun = false;
    
    if (node.nodeType === Node.TEXT_NODE) {
        switch (node.parentNode.tagName) {
        case "P":
        case "LI":
        case "H1":
        case "H2":
        case "H3":
        case "H4":
        case "H5":
        case "H6":
        case "FIGCAPTION":
        case "TH":
        case "TD":
            {
                if (offset === 0) {
                    console.log("go to divide node: " + node.parentNode.tagName);
                    undo_man.Begin(node, offset);
                    already_begun = true;

                    offset = GetIndex(node.parentNode, node);
                    node = node.parentNode;
                } else if (offset === node.length) {
                    console.log("go to divide node: " + node.parentNode.tagName);
                    undo_man.Begin(node, offset);
                    already_begun = true;

                    offset = GetIndex(node.parentNode, node) + 1;
                    node = node.parentNode;
                } else {
                    undo_man.Begin(node, offset);
                    already_begun = true;

                    DivideTextNode(node, offset);

                    offset = GetIndex(node.parentNode, node) + 1;
                    node = node.parentNode;                        
                }
            }
            break;
        case "SPAN":                
            if(IsTextNodeInMath(node)){
                const math = node.parentNode.parentNode;
                                
                if((node.parentNode.className=="editmathdisp")||
                    (node.parentNode.className=="editcodedisp")){    
                    const margin = GetEditMargin(math);
                    if((margin <= offset) && (offset <= node.length - margin)){
                        undo_man.Begin(node, offset);                    
                        InsertTextIntoText("\n", node, offset);
                        undo_man.End(node, offset+1);                    
                        document.getSelection().collapse(node, offset+1);
                        return true;
                    }                        
                }
            }
            return true; //to preventDefault.
        default:
            //nothing to do for span.math, span.inline and so on//
            return true;
        }        
    }

    

    switch (node.tagName) {
        case "P":
        case "H1":
        case "H2":
        case "H3":
        case "H4":
        case "H5":
        case "H6":
            {

                if (! already_begun ) {
                    undo_man.Begin(node, offset);
                }

                if(offset===0){
                    
                    //p node is added just before this node//
                    const p_node = AddNode("P", node.parentNode, node);
                    AddNode("BR", p_node, null);

                    undo_man.End(node, 0);
                    document.getSelection().collapse(node, 0);
                    return true;
                
                }

                //here, if node is li, offset can be 0. therefore, offset - 1 should not be used.//


                if(node.childNodes.length === offset){
                    const p_node = AddNode("P", node.parentNode, node.nextSibling);
                    AddNode("BR", p_node, null);                    
                    undo_man.End(p_node, 0);
                    document.getSelection().collapse(p_node, 0);
                    return  true;
                }

                //divide routine//
                const new_node = AddNode("P", node.parentNode, node.nextSibling);
                const fragment = SafeRemoveNodeList(node, node.childNodes.item(offset));
                let focus = SafePushNodeList(new_node, fragment);
                

                if(new_node.firstChild.nodeType===Node.TEXT_NODE){
                    if(new_node.firstChild.data== nt_ZWBR){
                        if (IsSpanMathImg(new_node.firstChild.nextSibling)){
                            const figure = ConvertPtoFigure(new_node);
                    //        focus = FocusOffsetZero(figure.lastChild);
                            
                        }else {
                            if (IsSpanMathCite(new_node.firstChild.nextSibling)){
                                ConvertMathCiteToRef(new_node.firstChild.nextSibling);
                            }
                        }
                    }
                }

                document.getSelection().collapse(focus.node, focus.offset);
                undo_man.End(focus.node, focus.offset);
                                
            }
            break;
            
        case "LI":        
                {
    
                    if (! already_begun ) {
                        undo_man.Begin(node, offset);
                    }
    
                    if(offset===0){                        
                        if(node.previousSibling===null){
                            if(node.parentNode.parentNode.nodeName==="DIV"){
                                //list is the first rank from render_div//
                                //p node is added just before this node//
                                const p_node = AddNode("P", node.parentNode.parentNode, node.parentNode);
                                AddNode("BR", p_node, null);

                                undo_man.End(node, 0);
                                document.getSelection().collapse(node, 0);
                                return true;
                            }
                        }else if(node.nextSibling===null){
                            if((node.firstChild.nodeName==="BR") && (node.firstChild.nextSibling===null)){
                                if(node.parentNode.parentNode.nodeName==="DIV"){
                                    //add new p node after this;
                                    const p_node = AddNode("P", node.parentNode.parentNode, node.parentNode.nextSibling);
                                    AddNode("BR", p_node, null);

                                    undo_man.End(p_node, 0);
                                    document.getSelection().collapse(p_node, 0);
                                    return true;
                                }
                            }
                        }

                        //add new li node before this//
                        const li_node = AddNode("LI", node.parentNode, node);
                        AddNode("BR", li_node, null);

                        undo_man.End(node, 0);
                        document.getSelection().collapse(node, 0);
                        return true;
                    
                    }
    
                    //here, if node is li, offset can be 0. therefore, offset - 1 should not be used.//
    
    
                    if(node.childNodes.length === offset){
                        const p_node = AddNode("LI", node.parentNode, node.nextSibling);
                        AddNode("BR", p_node, null);
                        undo_man.End(p_node, 0);
                        document.getSelection().collapse(p_node, 0);
                        return true;
                    }else{
                        const ref =node.childNodes.item(offset);
                        if((ref.nodeName === "OL") || (ref.nodeName === "UL")){
                            AddNode("BR", node, ref);              
                            //go to next divide routine//
                        }
                    }
    
                    //divide routine//
                    const new_node = AddNode("LI", node.parentNode, node.nextSibling);
                    const fragment = SafeRemoveNodeList(node, node.childNodes.item(offset));
                    const focus = SafePushNodeList(new_node, fragment);
                    
                    undo_man.End(focus.node, focus.offset);
                    document.getSelection().collapse(focus.node, focus.offset);
                        
                }
                break;
        case "FIGCAPTION":
            {

                if (! already_begun ) {
                    undo_man.Begin(node, offset);
                }
                
                const figure = node.parentNode;

                if(offset===0){
                    
                    //p node is added just before this node//
                    
                    const p_node = AddNode("P", figure.parentNode, figure.nextSibling);
                    const fragment = RemoveNodeList(node, node.firstChild, null); //this becomes null//
                    SafePushNodeList(p_node, fragment);　//this is already safe because original node of p is safe//
                    AddNode("BR", node, null);
                    

                    undo_man.End(p_node, 0);
                    document.getSelection().collapse(p_node, 0);
                    return true;
                
                }

                //here, if node is li, offset can be 0. therefore, offset - 1 should not be used.//


                if(node.childNodes.length === offset){
                    AddNode("BR", node, null);
                }

                //divide routine//
                const new_node = AddNode("P", figure.parentNode, figure.nextSibling);
                const fragment = SafeRemoveNodeList(node, node.childNodes.item(offset), null);
                const focus = SafePushNodeList(new_node, fragment);
                
                document.getSelection().collapse(focus.node, focus.offset);
                undo_man.End(focus.node, focus.offset);
            
            }
            break;
        case "FIGURE":
            if(offset===0){
                const new_node = AddNode("P", node.parentNode, node);
                AddNode("BR", new_node, null);
                undo_man.End(new_node, 0);
                document.getSelection().collapse(new_node, 0);                        
            }else{
                //nothing to do//
                undo_man.Cancel();
                //only the focus moves to figcaption//
                const focus = FocusOffsetZero(node.lastChild);
                if(focus){
                    document.getSelection().collapse(focus.node, focus.offset);      
                }
            }
            break;
        case "TH":
            {
                if(!is_shift){
                    const table = node.parentNode.parentNode;
                    if(table.previousSibling===null){                        
                        if (! already_begun ) {
                            undo_man.Begin(node, offset);
                        }
                        const p = AddNode("P", table.parentNode, table);
                        AddNode("BR", p, null);
                        undo_man.End(p, 0);
                        document.getSelection().collapse(p, 0);
                        return true;        
                    }            
                }
                
                if (already_begun ) {
                    undo_man.Cancel();
                    return true;
                }
            }
            break;
        case "TD":
            {
                if (! already_begun ) {
                    undo_man.Begin(node, offset);
                }

                
                if(!is_shift){
                    const table = node.parentNode.parentNode;
                    if(table.nextSibling===null){
                        const p = AddNode("P", table.parentNode, null);
                        AddNode("BR", p, null);
                        undo_man.End(p, 0);
                        document.getSelection().collapse(p, 0);
                        return true;
                    }            
                
                    break;
                }


                const org_tr = node.parentNode;
                const table = org_tr.parentNode;


                if(org_tr === table.firstChild.nextSibling){
                    undo_man.Cancel();
                    return true;
                }

                const new_tr = AddNode("TR", table, org_tr.nextSibling);
                let fnode=null;
                if(offset < node.childNodes.length){
                    
                    const fragment = SafeRemoveNodeList(node, node.childNodes.item(offset), null); 
                    const new_td = AddNode(node.tagName, new_tr, null);
                    SafePushNodeList(new_td, fragment);


                    if(!node.hasChildNodes()){
                        AddNode("BR", node, null);                    
                    }
                }
                if(node !== org_tr.lastChild){
                    const fragment = RemoveNodeList(org_tr, node.nextSibling, null);//not to need SafeRemoveNodeList for math because taregt parent is tr//
                    AddNodeList(new_tr, null, fragment);//not to need SafePushNodeList because taregt parent is tr//
                }

                
                const num_column = table.firstChild.childNodes.length;
                
                FillTdBr(org_tr, "TD", num_column);
                FillTdBr(new_tr, "TD", num_column);
                    
                const focus = FocusOffsetZero(new_tr);
                undo_man.End(focus.node, focus.offset);
                document.getSelection().collapse(focus.node, focus.offset);
                
                return true;
                
            }
            break;
        default:
            alert("ERROR: InputEnter at " + node.nodeName);
            undo_man.Cancel();
            break;
    }
    undo_man.Cancel();

    return true;
}


function SwitchInputDelete(node, offset, is_shift) {
    if (node === null) return;
    
    

    let already_begun = false;
        
    if (node.nodeType === Node.TEXT_NODE) {
        switch (node.parentNode.tagName) {
            case "P":
            case "LI":
            case "H1":
            case "H2":
            case "H3":
            case "H4":
            case "H5":
            case "H6":
            case "FIGCAPTION":
            case "FIGURE":
            case "TH":
            case "TD":
                {
                    if(node.data==nt_ZWBR){
                        offset = 1;
                    }

                    if (offset === node.length) {

                        if (node.nextSibling === null) {
                            console.log("go to parent: " + node.parentNode.tagName);
                            undo_man.Begin(node, offset);
                            already_begun = true;

                            node = node.parentNode;
                            offset = node.childNodes.length;
                        } else if (node.nextSibling.nodeType === Node.TEXT_NODE) {
                            undo_man.Begin(node, offset);
                            CombineTextNode(node);     // combine and delete charactor //
                            DeleteText(node, offset);
                            undo_man.End(node, offset);
                            document.getSelection().collapse(node, offset);
                            
                            return;
                        } else if (node.nextSibling.className === "math") {
                            //when next node is math, focus is only moved into editmath//
                            const math = node.nextSibling;
                            const focus = EnableMathEdit(math, 1);
                            document.getSelection().collapse(focus.node, focus.offset);

                            return;
                        } else { //OL, UL and BR are also//
                            console.log("go to  parent: " + node.parentNode.tagName);
                            undo_man.Begin(node, offset);
                            already_begun = true;

                            offset = GetIndex(node.parentNode, node) + 1;
                            node = node.parentNode;
                        }
                    } else {
                        undo_man.Begin(node, offset);
                        const focus = SafeDeleteInTextNode(node, offset);
                        if(focus){
                            undo_man.End(focus.node, focus.offset);
                            document.getSelection().collapse(focus.node, focus.offset);
                        }else{
                            undo_man.Cancel();
                        }

                        return;
                    }                   

                }
                break;
            case "SPAN":
                if(IsTextNodeInMath(node)){
                    const math = node.parentNode.parentNode;
                    const margin = GetEditMargin(math);
                    if (offset === node.length) {
                        node = math.parentNode;
                        offset = GetIndex(node, math) + 1;
                        break;
                    }else if (offset === node.length-1){
                        //complicate action depending on nextSibling, follows th e action of inputing right key //
                        SwitchInputArrowRight(node, offset, false);
                        return;
                    }else if ((offset < margin) || (node.length - margin <= offset)) {
                        if((node.parentNode.className === "editem2")||(node.parentNode.className === "editem3")){
                            const mark = node.data.slice(0,1);
                            undo_man.Begin(node, offset);
                            let math_old = node.parentNode.parentNode;
                            let math_new = AddMathNode(mark.repeat(margin-1), math_old.parentNode, math_old);
                            console.log("inline em and strong is rank down: ", math_new);
                            if(math_new){                                
                                InsertTextIntoText(node.data.slice(margin, node.length-margin), math_new.lastChild.lastChild, margin-1);
                                RemoveNode(math_old);
                            }
                                            
                            const focus = EnableMathEdit(math_new, (offset < margin) ? offset : offset - 1);
                            document.getSelection().collapse(focus.node, focus.offset);
                            undo_man.End(focus.node, focus.offset);       
                            return;
                        }else{
                            //for edit math and code code//
                            //because the inputing right key does not call preventDefault, which meas it use default action.//
                            //but, this default action is delete (not to move cursor right), then we should move self.
                            document.getSelection().collapse(node, offset + 1);
                            return;                    
                        }
                    }else{
                        undo_man.Begin(node, offset);
                        const focus = SafeDeleteInTextNode(node, offset);
                        if(focus){
                            undo_man.End(focus.node, focus.offset);
                            document.getSelection().collapse(focus.node, focus.offset);
                        }else{
                            undo_man.Cancel();
                        }

                        return;
                    }
                }
                break;
            default:
                //nothing to do for span.math, span.inline and so on//
                return;
        }
    }

    if(node.hasChildNodes()){
        const z = node.childNodes.item(offset);
        if(z){
            if(z.nodeType===Node.TEXT_NODE){
                if(z.data == nt_ZWBR){
                    offset ++;
                }
            }
        }
    }



    switch (node.tagName) {
        case "P":
        case "H1":
        case "H2":
        case "H3":
        case "H4":
        case "H5":
        case "H6":
            {

                if (!already_begun) {
                    undo_man.Begin(node, offset);
                }

                
                if ((node.firstChild.nodeName === "BR") && (node.firstChild.nextSibling===null)) {  //delete at null row (including BR tag)//
                    if (node.nextSibling===null) {
                        undo_man.Cancel();
                        return; //remain the final low//
                    }
                    if (node.nextSibling.nodeName=="FIGURE") {
                        undo_man.Cancel();
                        return; //remain the final low//
                    }
                            
                    const next = node.nextSibling;
                    RemoveNode(node);

                    if (next.firstChild.nodeType === Node.TEXT_NODE) {
                        undo_man.End(next.firstChild, 0);
                        document.getSelection().collapse(next.firstChild, 0);
                    } else if (next.tagName === "OL" || next.tagName === "UL") {
                        undo_man.End(next.firstChild, 0);
                        document.getSelection().collapse(next.firstChild, 0);
                    } else {
                        undo_man.End(next, 0);
                        document.getSelection().collapse(next, 0);
                    }
                    return;
                    
                }                


                if (offset < node.childNodes.length) {
                    let ch = node.childNodes.item(offset);
                    if (ch.nodeType === Node.TEXT_NODE) {
                        const focus = SafeDeleteInTextNode(ch, 0);
                        if(focus){
                            undo_man.End(focus.node, focus.offset);
                            document.getSelection().collapse(focus.node, focus.offset);
                        }else{
                            undo_man.Cancel();
                        }

                        

                    } else if (ch.nodeName === "BR") {
                        RemoveNode(ch);
                        undo_man.End(node, offset);
                        document.getSelection().collapse(node, offset);

                    } else if (ch.className === "math") {
                        //when next node is math, focus is only moved into editmath//
                        
                        const focus = EnableMathEdit(ch, 1);
                        document.getSelection().collapse(focus.node, focus.offset);

                    } else if (ch.tagName === "OL" || ch.tagName === "UL") {
                        alert("ERROR: p node cannot have a child of ol/ul.");
                    } else {
                        alert("ERROR: delete key before undefined element");
                    }
                } else { //offset >= node.childNodes.length//
                    

                    if (node.nextSibling === null) {
                        //EOF//
                        //nothing to do//
                        console.log("delete but EOF");
                        
                    
                    } else if (node.nextSibling.tagName === "P" ||
                        node.nextSibling.tagName === "H1" ||
                        node.nextSibling.tagName === "H2" ||
                        node.nextSibling.tagName === "H3" ||
                        node.nextSibling.tagName === "H4" ||
                        node.nextSibling.tagName === "H5" ||
                        node.nextSibling.tagName === "H6") {

                        const latter_head = node.nextSibling.firstChild;
                        if(IsSpanMathRef(latter_head)){
                            ConvertMathRefToCite(latter_head);
                        }

                        const focus = SafeCombineNode(node);
                        if(focus){
                            document.getSelection().collapse(focus.node, focus.offset);
                            undo_man.End(focus.node, focus.offset);
                        }else{
                            undo_man.Cancel();
                        }

                    } else if (node.nextSibling.tagName === "OL" ||
                        node.nextSibling.tagName === "UL") {
                        //when next node is ol/ul, first li node in child is combined //
                        let ol = node.nextSibling;
                        let ol_li = ol.firstChild;
                        let end_point = ol_li.firstChild; //which is ol/ul in the li node//
                        if(end_point.nodeName==="BR"){
                            if(end_point.nextSibling===null){ //empty li node
                                RemoveNode(ol_li);
                            }else{
                                const ol2 = end_point.nextSibling;
                                if((ol2.nodeName !== "OL") &&
                                   (ol2.nodeName !== "UL") ){
                                    alert("ERROR: li has some node after br");
                                    undo_man.Cancel();
                                    return;
                                }
                                const frag = RemoveNodeList(ol2, ol2.firstChild, null);//not to need safe operation because target parent is OL/UL//
                                AddNodeList(ol, ol_li, frag); //not to need safe operation because target parent is OL/UL//
                                RemoveNode(ol_li);
                            }
                                
                            if (!ol.hasChildNodes()) {
                                RemoveNode(ol);
                            }
                            undo_man.End(node, offset);
                            document.getSelection().collapse(node, offset);

                        }else{                           
                            
                            
                            while(end_point){
                                if(end_point.nodeName === "OL") break;
                                if(end_point.nodeName === "UL") break;
                                end_point = end_point.nextSibling;
                            }
                            
                            const fragment = RemoveNodeList(ol_li, ol_li.firstChild, end_point);//not to need safe operation because this will be removed//
                            const focus = SafePushNodeList(node, fragment);
                       
                            if(end_point){                            
                                const fragment2 = RemoveNodeList(end_point, end_point.firstChild);//not to need Safe operation because target parent is OL/UL//
                                AddNodeList(ol, ol_li, fragment2); //not to need Safe operation because target parent is OL/UL//
                            }
                            RemoveNode(ol_li);
                            
                            if (!ol.hasChildNodes()) {
                                RemoveNode(ol);
                            }
                            undo_man.End(focus.node, focus.offset);
                            document.getSelection().collapse(focus.node, focus.offset);
                            return true;
                        }
                        

                    } else if (node.nextSibling.tagName === "FIGURE"){

                        const figure = node.nextSibling;
                        const math_img = figure.firstChild;

                        let end_point = figure.firstChild;
                        while(end_point){
                            if(end_point.nodeName==="FIGCAPTION")break;
                            end_point = end_point.nextSibling;
                        }
                        
                        let focus = null;
                        if(figure.firstChild !== end_point){
                            const fragment = RemoveNodeList(figure, figure.firstChild, end_point);//not to need safe operation because this will be removed//
                            focus = SafePushNodeList(node, fragment);                            
                        }
                        if(end_point){// here (end_point.nodeName==="FIGCAPTION")//
                            
                            const fragment = RemoveNodeList(end_point, end_point.firstChild, null);//not to need safe operation because this will be removed with figure//
                            const f2 = SafePushNodeList(node, fragment);
                            if(focus === null){
                                focus = f2;
                            }

                        }
                        RemoveNode(figure);
                        //const focus = EnableMathEdit(math_img, 2);
                        document.getSelection().collapse(focus.node,focus.offset);
                        undo_man.End(focus.node,focus.offset);

                    } else {
                        alert("WARNING: delete key before undefined element");
                    }
                }
            }
            break;
        case "LI":
            {

                if (!already_begun) {
                    undo_man.Begin(node, offset);
                }

                
                if (node.firstChild.nodeName === "BR"){

                    if(node.firstChild.nextSibling){
                        const ol2 = node.firstChild.nextSibling;
                        if((ol2.nodeName !== "OL") &&
                            (ol2.nodeName !== "UL") ){
                            alert("ERROR: li has some node after br");
                            undo_man.Cancel();
                            return;
                        }
                        let frag = RemoveNodeList(ol2, ol2.firstChild, null);//not to need Safe operation because target parent is OL/UL//
                        const new_node = AddNodeList(node.parentNode, node, frag);//not to need SafePushNodeList because this is to combine of LI//
                        RemoveNode(node); //not to need Safe operation because target parent is OL/UL//
                        
                        undo_man.End(new_node, 0);
                        document.getSelection().collapse(new_node, 0);
                        return;
                    }

                    offset++;  //for skip last br//
                }


                if (offset < node.childNodes.length) {
                    let ch = node.childNodes.item(offset);
                    if (ch.nodeType === Node.TEXT_NODE) {
                        const focus = SafeDeleteInTextNode(ch, 0);
                        if(focus){
                            undo_man.End(focus.node, focus.offset);
                            document.getSelection().collapse(focus.node, focus.offset);
                        }else{
                            undo_man.Cancel();
                        }


                    } else if (ch.className === "math") {
                        //when next node is math, focus is only moved into editmath//
                        const focus = EnableMathEdit(ch, 1);
                        document.getSelection().collapse(focus.node, focus.offset);
                        undo_man.Cancel();
                        
                    
                    } else if (ch.tagName === "OL" || ch.tagName === "UL") {
                        //when next node is ol/ul, first li node in child is combined //

                        RaiseFirstLi(ch);
                        
                        undo_man.End(node, offset);
                        document.getSelection().collapse(node, offset);

                    } else {
                        alert("ERROR: delete key before undefined element");
                        undo_man.Cancel();
                    }


                } else {//offset == node.childNodes.length//
                    

                    if (node.nextSibling) {

                        //note: node is definitely not empty line here because node.nextSibling is not null//

                        if (node.nextSibling.nodeName !== "LI") {
                            alert("WARNING: delete key before undefined element");
                            undo_man.Cancel();
                            return;
                        }
                        
                        
                        const focus = SafeCombineNode(node);
                        if(focus){
                            document.getSelection().collapse(focus.node, focus.offset);
                            undo_man.End(focus.node, focus.offset);
                        }else{
                            undo_man.Cancel();
                        }


                    } else {  //node.nextSibling === null //

                        
                        //end of ol/ul//
                        //nothing to do//
                        console.log("delete end of ol/ul");
                        let parent_ol = node.parentNode;
                        if (parent_ol.nextSibling) {
                            if (parent_ol.nextSibling.nodeName === "P") {
                                //include all children in the next p node//
                                
                                const p = parent_ol.nextSibling;
                                const fragment = RemoveNodeList(parent_ol.nextSibling, parent_ol.nextSibling.firstChild);//not to need safe operation because this is OL/UL//
                                RemoveNode(p);
                                
                                const focus = SafePushNodeList(node, fragment);
                                if(focus){
                                    document.getSelection().collapse(focus.node, focus.offset);
                                    undo_man.End(focus.node, focus.offset);
                                }else{
                                    undo_man.Cancel();
                                }
                                
                                
                            }
                            else if ((parent_ol.nextSibling.nodeName === "OL" )||
                                (parent_ol.nextSibling.tagName === "UL")) {       //case of both ol/ul are top nodes which are children of master div//
                                //merge list//

                                let fragment = RemoveNodeList(parent_ol.nextSibling, parent_ol.nextSibling.firstChild);//not to need Safe operation because target parent is OL/UL//
                                AddNodeList(parent_ol, node.nextSibling, fragment); //not to need SafePushNodeList because this is to combine of LI//
                                RemoveNode(parent_ol.nextSibling);//not to need Safe operation because target parent is OL/UL//
                                undo_man.End(node, offset);
                                document.getSelection().collapse(node, offset);
                            } 
                            else if (parent_ol.nextSibling.nodeName === "FIGURE") {
                                //include all children in the next figure node//
                                
                                const figure = parent_ol.nextSibling;
                                const math_img = figure.firstChild;
                                let end_point = figure.firstChild;
                                while(end_point){
                                    if(end_point.nodeName==="FIGCAPTION")break;
                                    end_point = end_point.nextSibling;
                                }
                                
                                let focus = null;
                                if(figure.firstChild !== end_point){
                                    const fragment = RemoveNodeList(figure, figure.firstChild, end_point);//not to need safe operation because this will be removed//
                                    focus = SafePushNodeList(node, fragment);    //combine node//
                                }
                                if(end_point){
                                    if(end_point.nodeName==="FIGCAPTION"){
                                        const fragment = RemoveNodeList(end_point, end_point.firstChild, null);//not to need safe operation because this will be removed with figure//
                                        const f2 = SafePushNodeList(node, fragment);    //combine node//
                                        if(focus===null){
                                            focus = f2;
                                        }
                                    }
                                }

                                RemoveNode(figure);
                                //const focus = EnableMathEdit(math_img,2);
                                undo_man.End(focus.node, focus.offset);
                                document.getSelection().collapse(focus.node, focus.offset);
                                
                            
                            } else {

                                //nothing to do//
                                console.log("nothing to do: " + parent_ol.nextSibling.tagName);
                            }
                        } else {
                            let parent_parent = node.parentNode.parentNode;
                            if (parent_parent.tagName === "LI") {
                                if (parent_parent.nextSibling) {
                                    //merge list because parent_parent.nextSibling is li//

                                    let fragment = RemoveNodeList(parent_parent.parentNode, parent_parent.nextSibling, parent_parent.nextSibling.nextSibling);//not to need Safe operation because target parent is OL/UL//
                                    AddNodeList(parent_ol, node.nextSibling, fragment); //not to need SafePushNodeList because this is to combine of LI//
                                    undo_man.End(node, offset);
                                    document.getSelection().collapse(node, offset);
                                    
                                }
                            }
                        }
                    }
                }
            }
            break;
        case "FIGCAPTION":
            {

                if (!already_begun) {
                    undo_man.Begin(node, offset);
                }

                
                if ((node.firstChild.nodeName === "BR") && (node.firstChild.nextSibling===null)) {  //delete at null row (including BR tag)//
                    offset = 1;                    
                }

                if (offset < node.childNodes.length) {
                    let ch = node.childNodes.item(offset);
                    if (ch.nodeType === Node.TEXT_NODE) {
                        const focus = SafeDeleteInTextNode(ch, 0);
                        if(focus){
                            undo_man.End(focus.node, focus.offset);
                            document.getSelection().collapse(focus.node, focus.offset);
                        }else{
                            undo_man.Cancel();
                        }
                        

                    } else if (ch.nodeName === "BR") {
                        RemoveNode(ch);
                        undo_man.End(node, offset);
                        document.getSelection().collapse(node, offset);

                    } else if (ch.className === "math") {
                        //when next node is math, focus is only moved into editmath//
                        const focus = EnableMathEdit(ch, 1);
                        document.getSelection().collapse(focus.node, focus.offset);

                    } else if (ch.tagName === "OL" || ch.tagName === "UL") {
                        alert("ERROR: figcaption node cannot have a child of ol/ul.");
                    } else {
                        alert("ERROR: delete key before undefined element");
                    }
                } else { //offset >= node.childNodes.length//
                    
                    const next = node.parentNode.nextSibling;
                    if (next === null) {
                        //EOF//
                        //nothing to do//
                        console.log("delete but EOF");
                        
                    
                    } else if (next.tagName === "P" ||
                        next.tagName === "H1" ||
                        next.tagName === "H2" ||
                        next.tagName === "H3" ||
                        next.tagName === "H4" ||
                        next.tagName === "H5" ||
                        next.tagName === "H6") {

                        const fragment = RemoveNodeList(next, next.firstChild, null);//not to need safe operation because this will be removed//
                        const focus = SafePushNodeList(node, fragment);
                        RemoveNode(next);
                        document.getSelection().collapse(focus.node, focus.offset);
                        undo_man.End(focus.node, focus.offset);
                

                    } else if (next.tagName === "OL" ||
                        next.tagName === "UL") {
                        //when next node is ol/ul, first li node in child is combined //
                        let ol = next;
                        let ol_li = ol.firstChild;
                        let end_point = ol_li.firstChild; //which is ol/ul in the li node//
                        let fnode = node.firstChild;
                        let foffset = 0;

                        while(end_point){
                            if(end_point.nodeName === "OL") break;
                            if(end_point.nodeName === "UL") break;
                            end_point = end_point.nextSibling;
                        }
                        const fragment = RemoveNodeList(ol_li, ol_li.firstChild, end_point);//not to need safe operation because this will be removed//
                        let focus = SafePushNodeList(node, fragment);   //combine node//

                        if(end_point){                            
                            const fragment2 = RemoveNodeList(end_point, end_point.firstChild);//not to need Safe operation because target parent is OL/UL//
                            AddNodeList(ol, ol_li, fragment2);   //not to need SafePushNodeList because this is to combine of LI//
                        }
                        RemoveNode(ol_li);
                        
                        if (!ol.hasChildNodes()) {
                            RemoveNode(ol);
                        }

                        document.getSelection().collapse(focus.node, focus.offset);                        
                        undo_man.End(focus.node, focus.offset);


                    } else if (next.tagName === "FIGURE"){

                        const figure = next;
                        const math_img = figure.firstChild; 
                        let end_point = figure.firstChild;
                        while(end_point){
                            if(end_point.nodeName==="FIGCAPTION")break;
                            end_point = end_point.nextSibling;
                        }
                        
                        let focus = null;
                        if(figure.firstChild !== end_point){
                            const fragment = RemoveNodeList(figure, figure.firstChild, end_point);//not to need safe operation because this will be removed//
                            focus = SafePushNodeList(node, fragment);     //combine node//
                        }
                        if(end_point){
                            if(end_point.nodeName==="FIGCAPTION"){
                                const fragment = RemoveNodeList(end_point, end_point.firstChild, null);//not to need safe operation because this will be removed with figgure//
                                const f2 = SafePushNodeList(node, fragment);     //combine node//
                                if(focus===null){
                                    focus = f2;
                                }

                            }
                        }
                        RemoveNode(figure);

                        //const focus = EnableMathEdit(math_img, 2);
                        undo_man.End(focus.node, focus.offset);
                        document.getSelection().collapse(focus.node, focus.offset);
                    } else {
                        alert("WARNING: delete key before undefined element");
                    }
                }
            }
            break;
    
        case "TH":
        case "TD":
            {

                if (!already_begun) {
                    undo_man.Begin(node, offset);
                }

                
                if ((node.firstChild.nodeName === "BR") && (node.firstChild.nextSibling===null)) {  //delete at null row (including BR tag)//
                    
                    offset = 1;

                }                


                if (offset < node.childNodes.length) {
                    let ch = node.childNodes.item(offset);
                    if (ch.nodeType === Node.TEXT_NODE) {
                        const focus = SafeDeleteInTextNode(ch, 0);
                        if(focus){
                            undo_man.End(focus.node, focus.offset);
                            document.getSelection().collapse(focus.node, focus.offset);
                        }else{
                            undo_man.Cancel();
                        }

                        

                    } else if (ch.nodeName === "BR") {
                        RemoveNode(ch);
                        undo_man.End(node, offset);
                        document.getSelection().collapse(node, offset);

                    } else if (ch.className === "math") {
                        //when next node is math, focus is only moved into editmath//
                        const focus = EnableMathEdit(ch, 1);
                        document.getSelection().collapse(focus.node, focus.offset);

                    } else if (ch.tagName === "OL" || ch.tagName === "UL") {
                        alert("ERROR: td node cannot have a child of ol/ul.");
                    } else {
                        alert("ERROR: delete key before undefined element");
                    }
                } else { //offset >= node.childNodes.length//
                    
                    if(!is_shift){
                        break; 
                    }

                    if (node.nextSibling) {
                        const next = node.nextSibling;
                        const fragment = RemoveNodeList(next, next.firstChild, null);//not to need safe operation because this will be removed//
                        const focus = SafePushNodeList(node, fragment);    //combine node//
                        RemoveNode(next);

                        //add null td at last//
                        const new_td = AddNode(node.tagName, node.parentNode, null);
                        AddNode("BR", new_td, null);

                        document.getSelection().collapse(focus.node,focus.offset);
                        undo_man.End(focus.node,focus.offset);
                        return;
                    } else {//last td//
                        const next_tr = node.parentNode.nextSibling;
                        if(next_tr){//next tr row exits//

                            RemoveNode(next_tr);
                            undo_man.End(node, offset);
                            document.getSelection().collapse(node, offset);
                            return;
                        }
                    }
                      
                    //here, last td in last tr//
                    
                }
            }
            break;
        default:
            alert("ERROR: Delete at " + node.tagName);
            break;
    }

    undo_man.Cancel();


}


function SafeDeleteInTextNode(node, offset) {

    if(node.data==nt_ZWBR){
        console.error("tring to delete ZWBR");
        return null;
    }


    if (node.length === 1) {
        const parent = node.parentNode;
        const next = node.nextSibling;
        RemoveNode(node);
        const focus = SafeJunctionPoint(parent, next);
        return focus;
        /*
        undo_man.End(focus.node, focus.offset);
        document.getSelection().collapse(focus.node, focus.offset);
          */

        /*
        let p_node_to_figure = null;
        let cite_to_ref = null;
        
        if (node.previousSibling === null) {
            if (node.nextSibling === null) {
                AddNode("BR", parent, node);
                
            } else if ((node.nextSibling.nodeName === "OL") ||
                (node.nextSibling.nodeName === "UL")) {
                AddNode("BR", parent, node);
        
            } else if (node.nextSibling.className === "math"){
                
                if(node.nextSibling.lastChild.className==="editimg"){
                    if(parent.nodeName==="P"){
                        p_node_to_figure = parent;
                    }
                }else if(node.nextSibling.lastChild.className==="editcite"){
                    if(parent.nodeName==="P"){
                        cite_to_ref = node.nextSibling;
                    }
                }
            }

            RemoveNode(node);

            let focus;
            if(p_node_to_figure){
                const figure = ConvertPtoFigure(p_node_to_figure);
                focus = FocusOffsetZero(figure.lastChild);
            }else{
                if(cite_to_ref){
                    ConvertMathCiteToRef(cite_to_ref);
                }
                focus = FocusOffsetZero(parent);
            }
            undo_man.End(focus.node, focus.offset);
            document.getSelection().collapse(focus.node, focus.offset);
            

        }else{
            const prev = node.previousSibling;
            RemoveNode(node);            
            const focus = FocusOffsetLast(prev);
            undo_man.End(focus.node, focus.offset);
            document.getSelection().collapse(focus.node, focus.offset);
            
        }
        */
    } else {
        DeleteText(node, offset);
        return {node:node, offset:offset};
        /*
        undo_man.End(node, offset);
        document.getSelection().collapse(node, offset);
        */
    }

}


function GetIdealFocus(node, offset){
    if(node.nodeType===Node.TEXT_NODE){
        return [node, offset];
    }else{
        if((node.previousSibling) && (offset ===0)){
            if(node.previousSibling.nodeType===Node.TEXT_NODE){
                return [node.previousSibling, node.previousSibling.length];
            }
        }
        if(!node.hasChildNodes()){
            return [node.parentNode, GetIndex(node.parentNode, node)];
        }else{
            //here node has child//

            const ch = node.childNodes.item(offset);
            if(ch){
                if(ch.nodeType === Node.TEXT_NODE){
                    return [ch, 0];
                }else {
                    const prev = ch.previousSibling;
                    if(prev){
                        if(prev.nodeType === Node.TEXT_NODE){
                            return [prev, prev.length];
                        }
                    }

                    return GetIdealFocus(ch.firstChild, 0);                

                }
            }else{
                const prev = node.childNodes.item(offset-1);
                if(prev.nodeType === Node.TEXT_NODE){
                    return [prev, prev.length];
                }else {
                    if(prev.hasChildNodes()){
                        return GetIdealFocus(prev, prev.childNodes.length); 
                    }else{
                        return [node, offset-1]; 
                    }
                }
            }
        }
    }
    
}


/*

from:
    hogehoge<ol><li>FIRST</li><li>second</li></ol>

to:
    hogehogeFIRST<ol><li>second</li></ol>

and, if ol/ul node becomes empty, remove it
*/
function RaiseFirstLi(ol_node) {
    const ol_li = ol_node.firstChild;

    if((ol_li.firstChild.nodeName == "BR") && (ol_li.childNodes.length == 1) ){
        RemoveNode(ol_node);
    
    }else{    
        const fragment = RemoveNodeList(ol_li, ol_li.firstChild);
        RemoveNode(ol_li);
        const head = AddNodeList(ol_node.parentNode, ol_node, fragment); //become safe for math by the following two lines//
        SafeJunctionPoint(ol_node.parentNode, head);
        if(ol_node.hasChildNodes()){
            SafeJunctionPoint(ol_node.parentNode, ol_node);
        }else{
            RemoveNode(ol_node);
        }
    }

    
}

function LastFocusInList(prev){
    let last_li = prev.lastChild;
    while(last_li.lastChild.nodeName === "OL" || last_li.lastChild.nodeName === "UL") {
        last_li = last_li.lastChild.lastChild;
    }
    if(last_li.lastChild.nodeType === Node.TEXT_NODE) {
        return [last_li.lastChild, last_li.lastChild.length];
    }else{
        return [last_li, last_li.childNodes.length];
    }
}

function SwitchInputBackspace(node, offset, is_shift) {
    if (node === null) return;

    
    

    let already_begun = false;

    if (node.nodeType === Node.TEXT_NODE) {
        switch (node.parentNode.tagName) {
            case "P":
            case "LI":
            case "H1":
            case "H2":
            case "H3":
            case "H4":
            case "H5":
            case "H6":
            case "FIGCAPTION":
            case "FIGURE":
            case "TH":
            case "TD":
                {
                    if(node.data == nt_ZWBR){
                        offset = 0;
                    }

                    if (offset > 0 ) {

                        undo_man.Begin(node, offset);
                        const focus = SafeDeleteInTextNode(node, offset - 1);
                        if(focus){
                            undo_man.End(focus.node, focus.offset);
                            document.getSelection().collapse(focus.node, focus.offset);
                        }else{
                            undo_man.Cancel();
                        }

                        return;
                    } else {  //offset === 0//
                        if (node.previousSibling === null) {
                            console.log("go to parent: " + node.parentNode.tagName);
                            undo_man.Begin(node, offset);
                            already_begun = true;

                            node = node.parentNode;
                            offset = 0;
                        } else if (node.previousSibling.nodeType === Node.TEXT_NODE) {
                            undo_man.Begin(node, offset);
                            
                            const focus_node = node.previousSibling;
                            const focus_offset = node.previousSibling.length - 1;
                            CombineTextNode(focus_node);     // combine and delete charactor //
                            DeleteText(focus_node, focus_offset);
                            
                            undo_man.End(focus_node, focus_offset);
                            document.getSelection().collapse(focus_node, focus_offset);
                            return;
                        } else if (node.previousSibling.className === "math") {
                            //when next node is math, focus is only moved into editmath//
                            const math = node.previousSibling;
                            const focus = EnableMathEdit(math, -1);
                            document.getSelection().collapse(focus.node, focus.offset);
                            return;
                        } else { //OL, UL and BR are also//
                            console.log("go to  parent: " + node.parentNode.tagName);
                            undo_man.Begin(node, offset);
                            already_begun = true;

                            offset = GetIndex(node.parentNode, node) - 1;
                            node = node.parentNode;
                        }
                    }
                    break;
                }
            case "SPAN":
                if(IsTextNodeInMath(node)){
                    const math = node.parentNode.parentNode;
                    const margin = GetEditMargin(math);
                    if (offset === 0) {
                        node = math.parentNode;
                        offset = GetIndex(node, math) ;
                        break;
                    }else if (offset === 1){
                        //ccomplicate action depending on nextSibling, follows th e action of inputing left key //
                        SwitchInputArrowLeft(node, offset, false); 
                        return;
                    }else if ((offset <= margin) || (node.length - margin < offset)) {
                        if((node.parentNode.className === "editem2")||(node.parentNode.className === "editem3")){
                            const mark = node.data.slice(0,1);
                            undo_man.Begin(node, offset);
                            let math_old = node.parentNode.parentNode;
                            let math_new = AddMathNode(mark.repeat(margin-1), math_old.parentNode, math_old);
                            console.log("inline em and strong is rank down: ", math_new);
                            if(math_new){                                
                                InsertTextIntoText(node.data.slice(margin, node.length-margin), math_new.lastChild.lastChild, margin-1);
                                RemoveNode(math_old);
                            }
                                            
                            const focus = EnableMathEdit(math_new, (offset <= margin) ? offset - 1 : offset - 2);
                            document.getSelection().collapse(focus.node, focus.offset);
                            undo_man.End(focus.node, focus.offset);       
                            return;
                        }else{
                            //for math and code//
                            //because the inputing right key does not call preventDefault, which meas it use default action.//
                            //but, this default action is delete (not to move cursor right), then we should move self.
                            document.getSelection().collapse(node, offset - 1);
                            return;                    
                        }
                    }else{
                        undo_man.Begin(node, offset);
                        const focus = SafeDeleteInTextNode(node, offset-1);
                        if(focus){
                            undo_man.End(focus.node, focus.offset);
                            document.getSelection().collapse(focus.node, focus.offset);
                        }else{
                            undo_man.Cancel();
                        }

                        return;
                    }
                    
                }
                break;
            default:
                //nothing to do for span.math, span.inline and so on//
                return;
        }
    }

    if(node.hasChildNodes()){
        const z = node.childNodes.item(offset-1);
        if(z){
            if(z.nodeType===Node.TEXT_NODE){
                if(z.data == nt_ZWBR){
                    offset --;
                }
            }
        }
    }


    switch (node.tagName) {
        case "P":
        case "H1":
        case "H2":
        case "H3":
        case "H4":
        case "H5":
        case "H6":
            {

                if (!already_begun) {
                    undo_man.Begin(node, offset);
                }

                
                if ((node.firstChild.nodeName === "BR") && (node.firstChild.nextSibling===null)) {  //delete at null row (including BR tag)//
                    if (node.previousSibling===null) {
                        undo_man.Cancel();
                        return; //remain the first row//
                    }
                        
                    const prev = node.previousSibling;
                    RemoveNode(node);

                    let fnode = null;
                    let foffset = 0;
                    if (prev.lastChild.nodeType === Node.TEXT_NODE) {
                        fnode = prev.lastChild;
                        foffset = prev.lastChild.length;
                        
                    } else if (prev.nodeName === "OL" || prev.nodeName === "UL") {
                        [fnode, foffset] = LastFocusInList(prev);
                    } else {
                        fnode = prev;
                        foffset = prev.childNodes.length;                        
                        if(prev.lastChild.nodeName==="BR"){//focus cannot be set at position just after BR.
                            foffset--;
                        }
                    }
                    undo_man.End(fnode, foffset);
                    document.getSelection().collapse(fnode, foffset);
                    return;
                }
                


                if (offset > 0) {
                    
                    let ch = node.childNodes.item(offset-1);
                    if (ch.nodeType === Node.TEXT_NODE) {
                        const focus = SafeDeleteInTextNode(ch, ch.length - 1);
                        if(focus){
                            undo_man.End(focus.node, focus.offset);
                            document.getSelection().collapse(focus.node, focus.offset);
                        }else{
                            undo_man.Cancel();
                        }

                        
                    } else if (ch.tagName === "BR") {
                        RemoveNode(ch);
                        undo_man.End(node, offset-1);
                        document.getSelection().collapse(node, offset-1);

                    } else if (ch.className === "math") {
                        //when next node is math, focus is only moved into editmath//
                        const focus = EnableMathEdit(ch, -1);
                        document.getSelection().collapse( focus.node, focus.offset);
                        undo_man.Cancel();

                    } else if (ch.tagName === "OL" || ch.tagName === "UL") {
                        alert("ERROR: p node cannot have a child of ol/ul.");
                        undo_man.Cancel();
                    } else {
                        alert("ERROR: delete key before undefined element");
                        undo_man.Cancel();
                    }


                } else {//offset === 0//////////////////////////////////
                    let prev = node.previousSibling;
                    if (prev === null) {
                        //EOF//
                        //nothing to do//
                        console.log("backspace but BOF");
                        undo_man.Cancel();
                        return;

                    } else if (prev.tagName === "P" ||
                        prev.tagName === "H1" ||
                        prev.tagName === "H2" ||
                        prev.tagName === "H3" ||
                        prev.tagName === "H4" ||
                        prev.tagName === "H5" ||
                        prev.tagName === "H6") {

                        if(IsSpanMathRef(node.firstChild)){
                            if((prev.tagName==="P")&&(prev.lastChild.nodeName != "BR")){
                                ConvertMathRefToCite(node.firstChild);
                            }
                        }
                        const focus = SafeCombineNode(prev);     //combine node//
                        document.getSelection().collapse(focus.node, focus.offset);
                        undo_man.End(focus.node, focus.offset);


                    } else if (node.previousSibling.tagName === "OL" ||
                        node.previousSibling.tagName === "UL") {
                        const ol = node.previousSibling;
                        
                        //const target_li = AddNode("LI", ol, null);
                        //deplicate: when next node is ol/ul, the last li node in child is combined //
                        
                        //modified rule: p node connect into last list//
                        let target_li = ol.lastChild;
                        while((target_li.lastChild.nodeName==="OL")||(target_li.lastChild.nodeName==="UL")){
                            target_li = target_li.lastChild.lastChild;
                        }

                        const fragment = RemoveNodeList(node, node.firstChild);//not to need safe operation because this will be removed//
                        if(IsSpanMathRef(fragment.firstChild)){
                            ConvertMathRefToCite(fragment.firstChild);
                        }

                        const focus = SafePushNodeList(target_li, fragment);//combine node//                        
                        RemoveNode(node);

                        document.getSelection().collapse(focus.node,focus.offset);
                        undo_man.End(focus.node,focus.offset);
                        
                    } else if (node.previousSibling.nodeName === "FIGURE"){
                        
                        const figure = node.previousSibling;
                        const figcaption = figure.lastChild;
                        
                        const fragment = RemoveNodeList(node, node.firstChild, null);//not to need safe operation because this will be removed//
                        if(IsSpanMathRef(fragment.firstChild)){
                            ConvertMathRefToCite(fragment.firstChild);
                        }

                        const focus = SafePushNodeList(figcaption, fragment);//combine node//
                        RemoveNode(node);

                        undo_man.End(focus.node, focus.offset);
                        document.getSelection().collapse(focus.node, focus.offset);

                    }else {
                        alert("WARNING: delete key before undefined element");
                        undo_man.Cancel();
                    }
                }
            }
            break;
        case "LI"://////////////////////////////////////////////////////////////////////
            {

                
                if (!already_begun) {
                    undo_man.Begin(node, offset);
                }
               
                
                if (offset > 0) {
                    if(node.childNodes.item(offset-1).nodeName==="BR"){
                        offset--;
                    }
                }

                if (offset > 0) {
                    
                    let ch = node.childNodes.item(offset-1);
                    if (ch.nodeType === Node.TEXT_NODE) {
                        const focus = SafeDeleteInTextNode(ch, ch.length - 1);
                        if(focus){
                            undo_man.End(focus.node, focus.offset);
                            document.getSelection().collapse(focus.node, focus.offset);
                        }else{
                            undo_man.Cancel();
                        }

                    
                    } else if (ch.className === "math") {
                        //when next node is math, focus is only moved into editmath//
                        const focus = EnableMathEdit(ch, -1);
                        document.getSelection().collapse(focus.node, focus.offset);

                    } else if (ch.tagName === "OL" || ch.tagName === "UL") {
                        //when next node is ol/ul, first li node in child is combined //

                        const ol_li = ch.lastChild;                        
                        const fragment = SafeRemoveNodeList(node, node.childNodes.item(offset));                        
                        const focus = SafePushNodeList(ol_li , fragment);//combine node//
                        
                        document.getSelection().collapse(focus.node, focus.offset);                        
                        undo_man.End(focus.node, focus.offset);

                    } else {
                        alert("ERROR: backspace key after undefined element");
                        undo_man.Cancel();
                        return;
                    }


                } 
                else {//offset === 0//
                    
                    undo_man.Cancel();
                    
                    SwitchInputShiftTab(node,offset);
                    return;
                }
            }
            break;
        case "FIGCAPTION":
            {

                if (!already_begun) {
                    undo_man.Begin(node, offset);
                }

                
                if ((node.firstChild.nodeName === "BR") && (node.firstChild.nextSibling===null)) {  //delete at null row (including BR tag)//
                    offset = 0;
                }
                

                if (offset > 0) {
                    
                    let ch = node.childNodes.item(offset-1);
                    if (ch.nodeType === Node.TEXT_NODE) {
                        const focus = SafeDeleteInTextNode(ch, ch.length - 1);
                        if(focus){
                            undo_man.End(focus.node, focus.offset);
                            document.getSelection().collapse(focus.node, focus.offset);
                        }else{
                            undo_man.Cancel();
                        }

                        
                    } else if (ch.tagName === "BR") {
                        RemoveNode(ch);
                        undo_man.End(node, offset-1);
                        document.getSelection().collapse(node, offset-1);

                    } else if (ch.className === "math") {
                        //when next node is math, focus is only moved into editmath//
                        const focus = EnableMathEdit(ch, -1);
                        document.getSelection().collapse(focus.node, focus.offset);
                        undo_man.Cancel();

                    } else if (ch.tagName === "OL" || ch.tagName === "UL") {
                        alert("ERROR: figcaption node cannot have a child of ol/ul.");
                        undo_man.Cancel();
                    } else {
                        alert("ERROR: delete key before undefined element");
                        undo_man.Cancel();
                    }


                } else {//offset === 0//////////////////////////////////
                    let prev = node.previousSibling;
                    if (prev === null) {
                        undo_man.Cancel();
                        alert("figure has no img tag");
                        return;

                    } else {
                        const math = prev;
                        if (math.className !== "math") {
                            alert("figure has no img tag");
                            undo_man.Cancel();
                            return;
                        }
                        if (math.lastChild.className !== "editimg") {
                            alert("figure has no img tag");
                            undo_man.Cancel();
                            return;
                        }
                        
                        const focus = EnableMathEdit(math, -1);
                        document.getSelection().collapse(focus.node, focus.offset);
                        undo_man.Cancel();
                        return;
                    }
                }
            }
            break;
        case "TH":
        case "TD":
            {

                if (!already_begun) {
                    undo_man.Begin(node, offset);
                }

                
                if ((node.firstChild.nodeName === "BR") && (node.firstChild.nextSibling===null)) {  //delete at null row (including BR tag)//
                    offset = 0;
                }
                


                if (offset > 0) {
                    
                    let ch = node.childNodes.item(offset-1);
                    if (ch.nodeType === Node.TEXT_NODE) {
                        const focus = SafeDeleteInTextNode(ch, ch.length - 1);
                        if(focus){
                            undo_man.End(focus.node, focus.offset);
                            document.getSelection().collapse(focus.node, focus.offset);
                        }else{
                            undo_man.Cancel();
                        }

                    } else if (ch.tagName === "BR") {
                        RemoveNode(ch);
                        undo_man.End(node, offset-1);
                        document.getSelection().collapse(node, offset-1);

                    } else if (ch.className === "math") {
                        //when next node is math, focus is only moved into editmath//
                        const focus = EnableMathEdit(ch, -1);
                        document.getSelection().collapse(focus.node, focus.offset);
                        undo_man.Cancel();

                    } else if (ch.tagName === "OL" || ch.tagName === "UL") {
                        alert("ERROR: td node cannot have a child of ol/ul.");
                        undo_man.Cancel();
                    } else {
                        alert("ERROR: delete key before undefined element");
                        undo_man.Cancel();
                    }


                } else {//offset === 0//////////////////////////////////
                        
                    if(!is_shift){
                        break;
                    }
                    
                    let prev = node.previousSibling;
                    if (prev) { //
                        const focus = SafeCombineNode(prev);
                        
                        //add null td at last//
                        const new_td = AddNode(prev.tagName, prev.parentNode, null);
                        AddNode("BR", new_td, null);

                        document.getSelection().collapse(focus.node, focus.offset);                        
                        undo_man.End(focus.node, focus.offset);

                        return;
                    } else {
                        const prev_tr = node.parentNode.previousSibling;
                        if(prev_tr){
                            //remove current row//
                            RemoveNode(node.parentNode);
                            const focus = FocusOffsetLast(prev_tr);
                            undo_man.End(focus.node, focus.offset);
                            document.getSelection().collapse(focus.node, focus.offset);
                            return;
                        }                    
                    }

                    
                }
            }
            break;
        default:
            alert("ERROR: Delete at " + node.tagName);
            undo_man.Cancel();
            break;
    }

    undo_man.Cancel();


}


function SwitchInputArrowRight(node, offset, is_shift) {
    if (node === null) return true;
    if(is_shift) return SwitchInputArrowRightShift(node,offset);
    

    if (node.nodeType === Node.TEXT_NODE) {
        if(IsTextNodeInMath(node)){
            const math = node.parentNode.parentNode; 
            
            if (offset >= node.length-1){
                const res = DisableEdit(math);
                if(res.removed){
                    document.getSelection().collapse(res.focus.node, res.focus.offset);
                }else{
                    if(math.nextSibling===null){
                        console.error("math.nextSibling is null");
                    }else if(math.nextSibling.nodeType===Node.TEXT_NODE){
                        if(math.nextSibling.data == nt_ZWBR){
                            document.getSelection().collapse(math.nextSibling, 1);
                        }else{
                            document.getSelection().collapse(math.nextSibling, 0);
                        }
                    }else{
                        const focus = FocusOffsetZero(math.nextSibling);
                        if(focus){
                            if(focus.node.nodeType === Node.TEXT_NODE){
                                if(focus.node.data == nt_ZWBR){
                                    focus.offset = 1;
                                }
                            }
                            document.getSelection().collapse(focus.node, focus.offset);
                            
                        }else{
                            console.error("math.nextSibling cannot has focus");
                        } 
                    }
                }                   
                
                return true;
            }           
    
            //do default//
            return false;  
        }
        else { //here, text node in p, li, h1//
            if(node.data == nt_ZWBR){
                offset = 1;
            }

            if (offset === node.length){
                console.log("end of text node");

                offset = GetIndex(node.parentNode, node)+1;
                node = node.parentNode;

                //go to switch//
                
            }else{
                //do default//
                return false;    
            }
        }
        
    }    
    

    switch (node.nodeName) {
    case "P":
    case "H1":
    case "H2":
    case "H3":
    case "H4":
    case "H5":
    case "H6":
    case "LI":
    case "FIGCAPTION":
    case "FIGURE":
    case "TH":
    case "TD":
    case "DIV":
        {       
            let ch = node.childNodes.item(offset);    
            if(ch){
                if( ch.nodeType===Node.TEXT_NODE){
                    document.getSelection().collapse(ch, 1);
                    return true;
                }else if(ch.className==="math"){
                    const focus = EnableMathEdit(ch, 1);
                    document.getSelection().collapse(focus.node, focus.offset);
                    return true;
                }else if(ch.nodeName == "BR"){
                    //document.getSelection().collapse(node, offset + 1);
                    //return true;
                    node = ch;
                }else{
                    const focus = FocusOffsetZero(ch);
                    if(focus){
                        document.getSelection().collapse(focus.node, focus.offset);                            
                    }else{
                        console.error("cannot find focus position");                            
                    }
                    return true;
                }
            }

            let p = node;
            while (p.nextSibling===null){                    
                p = p.parentNode;
                if(p.tagName==="DIV"){return true;}
            }
            const focus = FocusOffsetZero(p.nextSibling);
            if(focus){
                document.getSelection().collapse(focus.node, focus.offset);                            
            }else{
                console.error("cannot find focus position");                            
            }
            
            return true;
            
            
        }
        break;        
    }

    return false;
}

function SwitchInputArrowRightShift(node, offset) {
    if (node === null) return true;
  

    if (node.nodeType === Node.TEXT_NODE) {
        if(IsTextNodeInMath(node)){
            const math = node.parentNode.parentNode; 
            const margin = GetEditMargin(math);

            if (offset >= node.length - margin){
                console.log("end of math text node");

                
                if(document.getSelection().anchorNode===math.lastChild.firstChild){
                    //both focus and anchor are in this text node//
                    
                    const res = DisableEdit(math);
                    if(res.removed){
                        document.getSelection().collapse(res.focus.node, res.focus.offset);
                    }else{
                        const foffset = GetIndex(math.parentNode, math);
                        document.getSelection().setBaseAndExtent(math.parentNode, foffset, math.parentNode, foffset + 1);    
                    } 
                }else{
                    const res = DisableEdit(math);
                    if(res.removed){
                        document.getSelection().extend(res.focus.node, res.focus.offset);
                    }else{                    
                        const foffset = GetIndex(math.parentNode, math);
                        document.getSelection().extend(math.parentNode, foffset + 1);
                    }   
                }
                return true;
                
            }else if (offset === 0){
                
                const res = DisableEdit(math);
                if(res.removed){
                    document.getSelection().extend(res.focus.node, res.focus.offset);
                    return true;
                }
                     
                offset = GetIndex(math.parentNode, math);
                node = math.parentNode;                
                //go to switch//
            
            }else{           
                document.getSelection().extend(node, offset + 1);
                return true;
            }
        }
        else { //here, text node in p, li, h1//
            if(node.data == nt_ZWBR){
                offset = 1;
            }

            if (offset === node.length){
                console.log("end of text node");

                offset = GetIndex(node.parentNode, node) + 1;
                node = node.parentNode;
                //go to switch // 

            }else{           
                document.getSelection().extend(node, offset + 1);
                return true;    
            }

        }
        
    }    
    
    //for select table mode//
    if((node.tagName == "TH") || (node.tagName == "TD")){
        if(offset == node.childNodes.length){
            SetSelectTable(node, node);
            return true;
        }
    }


    switch (node.nodeName) {
    case "P":
    case "H1":
    case "H2":
    case "H3":
    case "H4":
    case "H5":
    case "H6":
    case "LI":
    case "FIGCAPTION":
    case "FIGURE":
    case "TH":
    case "TD":
        {       
            const ch = node.childNodes.item(offset);    
            if(ch){
                if( ch.nodeType===Node.TEXT_NODE){
                    document.getSelection().extend(ch, 1);
                    return true;
                }else if(ch.nodeName == "SPAN"){
                    document.getSelection().extend(node, offset+1);
                    return true;
                }else if(ch.nodeName =="BR"){
                    node = ch;
                }else {
                    const focus = FocusOffsetZero(ch, false);
                    if(focus){
                        document.getSelection().extend(focus.node, focus.offset);                            
                    }else{
                        console.error("cannot find focus position", ch);                            
                    }
                    return true;
                }
            }

            let p = node;
            while (p.nextSibling===null){                    
                p = p.parentNode;
                if(p.tagName==="DIV"){return true;}
            }
            
            //check which prev element is table or not//
            if(p.nextSibling.nodeName=="TABLE"){
                const table = p.nextSibling;
                const master = table.parentNode;
                document.getSelection().extend(master, GetIndex(master, table)+1);
                return true;
            }
            
            const focus = FocusOffsetZero(p.nextSibling,false);
            if(focus){
                document.getSelection().extend(focus.node, focus.offset);                          
            }else{
                console.error("cannot find focus position", p.nextSibling);
            }
            return true;
            
        }
        break;
    case "DIV":
        //check when node is master div//
        {
            const expect_table = node.childNodes.item(offset);
            if(expect_table===null){
                return false;
            }
            if(expect_table.nodeName=="TABLE"){
                document.getSelection().extend(node, offset+1);
                return true;
            }else{
                const focus = FocusOffsetZero(expect_table, false);
                if(focus){
                    document.getSelection().extend(focus.node, focus.offset);                            
                }else{
                    console.error("cannot find focus position", expect_table);                            
                }
                return true;
            }        
        }
        break;
    
    }
    return false;
}



function FocusOffsetZero(node, is_enable_math = true){
    
    while(node){        
        if(node.nodeType===Node.TEXT_NODE){
            return {node: node, offset: 0};
        }
        if(node.firstChild===null){ //expect BR//
            return {node: node.parentNode, offset: GetIndex(node.parentNode, node)};
        }

        if (node.firstChild.nodeName==="BR" ){
                return {node: node, offset: 0};
        }
        
        if(node.className==="math"){
            if(is_enable_math){
                return EnableMathEdit(node, 0);
            }else{
                return {node: node.parentNode, offset: GetIndex(node.parentNode, node)};
            }
        }
        node = node.firstChild;
    }
    return null;

}




function SwitchInputArrowLeft(node, offset, is_shift) {
    if (node === null) return true;
    if (is_shift) return SwitchInputArrowLeftShift(node, offset);
    
    if (node.nodeType === Node.TEXT_NODE) {
        if(IsTextNodeInMath(node)){
            const math = node.parentNode.parentNode;
            if(offset <= 1){
            
                if((math.parentNode.nodeName == "FIGURE") && (math.previousSibling === null)){
                    const figure = math.parentNode;
                    const res = DisableEdit(math);
                    if(res.removed){
                        const p_node = ConvertFiguretoP(figure);
                        const focus = FocusOffsetZero(p_node);
                        document.getSelection().collapse(focus.node, focus.offset);
                    }else{
                        if(figure.previousSibling){
                            const focus = FocusOffsetLast(figure.previousSibling);
                            if(focus){ 
                                if(focus.node.nodeType === Node.TEXT_NODE){
                                    if(focus.node.data == nt_ZWBR){
                                        focus.offset = 0;
                                    }
                                }                        
                                document.getSelection().collapse(focus.node, focus.offset);
                            }else{
                                console.error("math.previousSibling cannot has focus",math.previousSibling);
                            }
                        }else{
                            undo_man.Begin(node, offset);
                            const p_node = AddNode("P", figure.parentNode, figure);
                            AddNode("BR", p_node, null);
                            undo_man.End(p_node, 0);
                            document.getSelection().collapse(p_node, 0);
                        }
                    }

                }else{
                    
                    const res = DisableEdit(math);
                    if(res.removed){
                        document.getSelection().collapse(res.focus.node, res.focus.offset);
                    }else{
                        const focus = FocusOffsetLast(math.previousSibling);
                        if(focus){ 
                            if(focus.node.nodeType === Node.TEXT_NODE){
                                if(focus.node.data == nt_ZWBR){
                                    focus.offset = 0;
                                }
                            }                        
                            document.getSelection().collapse(focus.node, focus.offset);
                        }else{
                            console.error("math.previousSibling cannot has focus",math.previousSibling);
                        }    
                    }                   
                }
                return true;
            }
            
            //do default//
            return false;            
            
        }
        else{  // not in math //
            if(node.data == nt_ZWBR){
                offset = 0;
            }

            if (offset === 0){
                console.log("begin of text node");
                
                offset = GetIndex(node.parentNode, node);
                node = node.parentNode;

                //go to switch//

            }else{
                //do default//
                return false;
            }            
        }
    }
    


    switch (node.tagName) {
    case "P":
    case "H1":
    case "H2":
    case "H3":
    case "H4":
    case "H5":
    case "H6":
    case "LI":
    case "FIGCAPTION":
    case "FIGURE":
    case "TH":
    case "TD":  
    case "DIV":           
        {               
            const ch = node.childNodes.item(offset-1);
            if(ch ){
                if( ch.nodeType===Node.TEXT_NODE){
                    document.getSelection().extend(ch, ch.length - 1);
                    return true;
                }else if(ch.className==="math"){
                    const focus = EnableMathEdit(ch, -1);
                    document.getSelection().collapse(focus.node, focus.offset);
                    return true;
                }else if(ch.nodeName == "BR"){
                    node = ch;
                }else{
                    const focus = FocusOffsetLast(ch);
                    if(focus){
                        document.getSelection().collapse(focus.node, focus.offset);
                    }else{
                        console.error("cannot find focus position", ch);
                    }
                    return true;
                }
            }

            let p = node;
            while (p.previousSibling===null){                    
                p = p.parentNode;
                if(p.tagName==="DIV"){return true;}
            }
            const focus = FocusOffsetLast(p.previousSibling);
            if(focus){
                document.getSelection().collapse(focus.node, focus.offset);
            }else{
                console.error("cannot find focus position", p.previousSibling);
            }                  
            return true; 
        
        }
    }

}


function SwitchInputArrowLeftShift(node, offset) {
    if (node === null) return true;
    
    if (node.nodeType === Node.TEXT_NODE) {
        if(IsTextNodeInMath(node)){
            const math = node.parentNode.parentNode;
            const margin = GetEditMargin(math);
    
            if (offset <= margin) {
                console.log("begin of math text node");

                if(document.getSelection().anchorNode===math.lastChild.firstChild){
                    //both focus and anchor are in this text node//
                    
                    const res = DisableEdit(math);
                    if(res.removed){
                        document.getSelection().collapse(res.focus.node, res.focus.offset);
                    }else{
                        const foffset = GetIndex(math.parentNode, math);
                        document.getSelection().setBaseAndExtent(math.parentNode, foffset + 1, math.parentNode, foffset);    
                    } 
                }else{
                    const res = DisableEdit(math);
                    if(res.removed){
                        document.getSelection().extend(res.focus.node, res.focus.offset);
                    }else{                    
                        const foffset = GetIndex(math.parentNode, math);
                        document.getSelection().extend(math.parentNode, foffset);
                    }   
                }
                return true;

            }else if (offset === node.length){

                const res = DisableEdit(math);
                if(res.removed){
                    document.getSelection().extend(res.focus.node, res.focus.offset);
                    return true;
                }
                
                offset = GetIndex(math.parentNode, math);
                node = math.parentNode;
                //go to switch//
                
            }else{
                document.getSelection().extend(node, offset - 1);
                return true;            
            }
        }
        else{  //here, text node in p, li, h1//
            if(node.data == nt_ZWBR){
                offset = 0;
            }

            if (offset === 0){
                console.log("begin of text node");
                
                offset = GetIndex(node.parentNode, node);
                node = node.parentNode;
                //go to switch//

            }else{
                document.getSelection().extend(node, offset - 1);
                return true;
            }            
        }
    }
    
    //for select table mode//
    if((node.tagName == "TH") || (node.tagName == "TD")){
        if(offset == 0){
            SetSelectTable(node, node);
            return true;
        }
    }



    switch (node.tagName) {
    case "P":
    case "H1":
    case "H2":
    case "H3":
    case "H4":
    case "H5":
    case "H6":
    case "LI":
    case "FIGCAPTION":
    case "FIGURE":
    case "TH":
    case "TD":            
        {               
            const ch = node.childNodes.item(offset-1);
            if(ch ){
                if( ch.nodeType===Node.TEXT_NODE){
                    document.getSelection().extend(ch, ch.length - 1);
                    return true;
                }else if(ch.nodeName == "SPAN"){
                    document.getSelection().extend(node, offset-1);
                    return true;
                }else if(ch.nodeName =="BR"){
                    node = ch;
                }else {
                    const focus = FocusOffsetLast(ch, false);
                    if(focus){
                        document.getSelection().extend(focus.node, focus.offset);                            
                    }else{
                        console.error("cannot find focus position", ch);                            
                    }
                    return true;
                }
            }

            let p = node;
            while (p.previousSibling===null){                    
                p = p.parentNode;
                if(p.tagName==="DIV"){return true;}
            }
            
            //check which prev element is table or not//
            if(p.previousSibling.nodeName=="TABLE"){
                const table = p.previousSibling;
                const master = table.parentNode;
                document.getSelection().extend(master, GetIndex(master, table));
                return true;
            }

            const focus = FocusOffsetLast(p.previousSibling, false);
            if(focus){
                document.getSelection().extend(focus.node, focus.offset);                            
            }else{
                console.error("cannot find focus position", p.previousSibling);                            
            }
            return true;
        }
        break;
    case "DIV":  
        {
        //check when node is master div//
            const expect_table = node.childNodes.item(offset-1);
            if(expect_table===null){
                return false;
            }
            if(expect_table.nodeName=="TABLE"){
                document.getSelection().extend(node, offset-1);
                return true;
            }else{
                const focus = FocusOffsetLast(expect_table, false);
                if(focus){
                    document.getSelection().extend(focus.node, focus.offset);                            
                }else{
                    console.error("cannot find focus position", expect_table);                            
                }
                return true;
            }
        }
        break;
    }
    return false; 
}




function FocusOffsetLast(node, is_enable_math = true){
    
    while(node){
        if(node.nodeType===Node.TEXT_NODE){
            return {node: node, offset: node.length};
        }
        if(node.firstChild===null){ //expect BR//
            return {node: node.parentNode, offset: GetIndex(node.parentNode, node)};
        }

        if (node.firstChild.nodeName==="BR" ){
                return {node: node, offset: 0};
        }
        
        if(node.className==="math"){
            if(is_enable_math){
                return EnableMathEdit(node, -1);
            }else{
                return {node: node.parentNode, offset: GetIndex(node.parentNode, node)};
            }
        }
        node = node.lastChild;
    }
    return null;

}


function SwitchInputMath(mark, node, offset) {
    if (node === null) return;
    
    let class_name;
    switch(mark){
    case '$':
        class_name = "editmath";
        break;
    case '`':
        class_name = "editcode";
        break;
    case '*':
    case '_':
        class_name = "editem";
        break;
    /*
    case '[':
        class_name = "edita";
        if((node.nodeType === Node.TEXT_NODE) && (offset>0)){
            if(node.data.charAt(offset-1) === '!'){
                class_name = "editimg";
                mark = "![";
            }
        }
        break;
    */
    default:
        return;
    }

    
    
    if (node.nodeType === Node.TEXT_NODE) {
        //if(node.parentNode.className==="editmathdisp") return;
        if(node.parentNode.nodeName==="SPAN" ){
            //here, enhance math, 
            //"$" to "$$"
            //"*" to "**", "***"

            if(node.parentNode.className.slice(0, node.parentNode.className.length-1) === class_name){
                //em or strong//
                const margin = GetEditMarginByClassName(node.parentNode.className);
                if(!( (offset === margin) || (offset === node.length - margin))) return;


                undo_man.Begin(node, offset);
                let math_old = node.parentNode.parentNode;
                let math_new = AddMathNode(mark.repeat(margin+1), math_old.parentNode, math_old);
                console.log("inline em and strong is rank up: ", math_new);
                if(math_new){
                    
                    InsertTextIntoText(node.data.slice(margin, node.length-margin), math_new.lastChild.lastChild, margin+1);
                    RemoveNode(math_old);
                }
                                
                const focus = EnableMathEdit(math_new, offset+1 );
                document.getSelection().collapse(focus.node, focus.offset);
                undo_man.End(focus.node, focus.offset);       
                return;

            
            }else if(node.parentNode.className===class_name){
                //math or code//
                
                const margin = GetEditMarginByClassName(class_name+"disp");
                if(!( (0 < offset) && (offset < margin))) return;

                if(node.length >= margin){
                    if(node.data.slice(0,margin-1) === mark.repeat(margin-1)){
                        
                        undo_man.Begin(node, offset);
                        let math_inline = node.parentNode.parentNode;
                        let math_display = AddMathNode(mark.repeat(margin), math_inline.parentNode, math_inline);
                        console.log("inline math to display math: ", math_display);
                        if(math_display){
                            //initial text in math_display is "$$\n\n$$" or "```\n\n```" //
                            InsertTextIntoText(node.data.slice(margin-1, node.length-(margin-1)), math_display.lastChild.lastChild, margin+1);
                            RemoveNode(math_inline);
                        }
                        
                        if(class_name==="editmath"){
                            SetEqNumber(math_display, 1);
                        }
                        const focus = EnableMathEdit(math_display, margin+1);
                        document.getSelection().collapse(focus.node, focus.offset);
                        undo_man.End(focus.node, focus.offset);       
                        return;
                    }
                }
            }
            undo_man.Begin(node, offset);
            InsertTextIntoText(mark, node, offset);
            undo_man.End(node, offset+1);  
            document.getSelection().collapse(node, offset+1);
            return;
        }else {//not child of SPAN//

            console.log("add inline ", class_name);
            undo_man.Begin(node, offset);
            const parent = node.parentNode;
            let ref_node;
            if(offset===0){
                ref_node = node;
            }else if(offset===node.length){
                ref_node = node.nextSibling;
            }else{
                ref_node = DivideTextNode(node, offset);            
            }            
            
            const math = AddMathNode(mark, parent, ref_node);
            if(!IsTextNode(math.previousSibling)){
                AddTextNode(nt_ZWBR, parent, math);
            }
            if(!IsTextNode(math.nextSibling)){
                AddTextNode(nt_ZWBR, parent, math.nextSibling);
            }

            /*
            if(mark==="!["){
                if(node.length===1){
                    RemoveNode(node);
                    if(parent.nodeName==="P"){
                        if(parent.firstChild===math){
                            ConvertPtoFigure(parent);
                        }
                    }
                }else{
                    DeleteText(node, offset-1);
                }
                
            }
            */
            
            const focus = EnableMathEdit(math, 1);            
            document.getSelection().collapse(focus.node, focus.offset);
            undo_man.End(focus.node, focus.offset);
            return;
        }
    }


    switch (node.tagName) {
        case "P":  //here, math of img cannot be added by this path//
        case "LI":
        case "H1":
        case "H2":
        case "H3":
        case "H4":
        case "H5":
        case "H6":
        case "FIGCAPTION":
        case "FIGURE":
        case "TH":
        case "TD":
            {

                let br_node = null;
                if(offset === 0){
                    if(node.firstChild.nodeName==="BR") {
                        if(node.firstChild.nextSibling === null){
                            br_node = node.firstChild;
                        } else if((node.firstChild.nextSibling.nodeName==="UL") || (node.firstChild.nextSibling.nodeName==="OL")){
                            br_node = node.firstChild;
                        }else{
                            console.error("invalid position of BR tag");
                        }
                    }
                }
                //special case, child is only br node//
                
                undo_man.Begin(node, offset);
                let ref_node = node.childNodes.item(offset);
                let math = AddMathNode(mark, node, ref_node);

                if(br_node){
                    RemoveNode(br_node);
                }
                if(!IsTextNode(math.previousSibling)){
                    AddTextNode(nt_ZWBR, node, math);
                }
                if(!IsTextNode(math.nextSibling)){
                    AddTextNode(nt_ZWBR, node, math.nextSibling);
                }
                
                
                const focus = EnableMathEdit(math, 1);
                document.getSelection().collapse(focus.node, focus.offset);
                undo_man.End(focus.node, focus.offset);
                return;
            
            
            }
            break;            
        default:
            alert("ERROR: InputChar at " + node.tagName);
            break;
    }
   
    
}



function SwitchInputMathSelection(mark, node, offset, anchor_node, anchor_offset) {
    if (node === null) return;
    if (node !== anchor_node) return;
    if(node.nodeType !== Node.TEXT_NODE) return;
    
    let class_name;
    switch(mark){
    case '$':
        class_name = "editmath";
        break;
    case '`':
        class_name = "editcode";
        break;
    case '*':
    case '_':
        class_name = "editem";
        break;
    case '**':
    case '_':
        class_name = "editem";
        break;
    default:
        return;
    }

    if( ! IsTextNodeInMath(node) ) {    //not child of SPAN//

        console.log("change to math span: ", class_name);
        undo_man.Begin( node, offset, anchor_node, anchor_offset );
        const parent = node.parentNode;

        const [begin_off, end_off] = (anchor_offset  < offset ) ? [anchor_offset, offset] : [offset, anchor_offset];

        if(end_off < node.length){
            DivideTextNode(node, end_off);
        }
        const ref_node = (begin_off == 0) ? node : DivideTextNode(node, begin_off);
                    
        
        const math = AddMathNode(mark, parent, ref_node);
        const math_text = math.lastChild.firstChild;
        const margin = GetEditMargin(math);
        InsertTextIntoText(ref_node.data, math_text, margin);
        RemoveNode(ref_node);

        if(!IsTextNode(math.previousSibling)){
            AddTextNode(nt_ZWBR, parent, math);
        }
        if(!IsTextNode(math.nextSibling)){
            AddTextNode(nt_ZWBR, parent, math.nextSibling);
        }        
        
        const focus = EnableMathEdit(math, 1);  
        document.getSelection().collapse(focus.node, focus.offset);
        undo_man.End(focus.node, focus.offset);
        return;
    }


}


/*
 check the creation of h1 and ol/ul/li tag by inputing "# " and "- "
*/
function SwitchInputSpace( node, offset) {
    if (node === null) return false;

    const is_H1to6 = (tagName) => {
        return (( "H1" <= tagName) && (tagName <= "H6"));
    };

    if (node.nodeType !== Node.TEXT_NODE) {
        if((node.tagName==="P") || is_H1to6(node.tagName) ){
            node = node.childNodes.item(offset - 1);  //set the focus to child text node//
            if(node===null) return false;
            offset = node.length;
        }else{
            return false;
        }
    }

    if (node.nodeType === Node.TEXT_NODE) {
        let parent = node.parentNode;
        if(parent.tagName === "P"){
            if(node !== parent.firstChild ) return false;
            const head_word = node.data.substring(0,offset);
            
        
            let tagname = "none";
            switch(head_word){
                case "-": tagname = "UL"; break;
                case "*": tagname = "UL"; break;
                case "+": tagname = "UL"; break;
                case "#": tagname = "H1"; break;
                case "##": tagname = "H2"; break;
                case "###": tagname = "H3"; break;
                case "####": tagname = "H4"; break;
                case "#####": tagname = "H5"; break;
                case "######": tagname = "H6"; break;
            }
            if(head_word[head_word.length-1] === '.'){
                tagname = "OL";
                for(let i = 0; i < head_word.length-1; ++i) {
                    if((head_word[i] < '0') || ( '9' < head_word[i])){
                        tagname = "none";
                    }
                }
            }
            if(tagname === "none") return false;

            undo_man.Begin(node, offset);
            let new_node;
            if(tagname === "UL"){
                const ul = AddNode(tagname, parent.parentNode, parent);
                new_node = AddNode("LI", ul, null);            
            }else if(tagname === "OL"){
                const ul = AddNode(tagname, parent.parentNode, parent);
                new_node = AddNode("LI", ul, null);            
            }else{
                new_node = AddNode(tagname, parent.parentNode, parent);
            }

            if(node.length !== offset){
                DivideTextNode(node, offset);  //for remove head_word
            }
            
            let focus;
            if(node.nextSibling){
                const fragment = RemoveNodeList(parent, node.nextSibling, null );//not to need safe operation becase this node will be removed//
                focus = SafePushNodeList(new_node, fragment);
            }else{
                AddNode("BR", new_node, null);
                focus = {node: new_node, offset: 0};
            }
        
            RemoveNode(parent);

            undo_man.End(focus.node, focus.offset);
            document.getSelection().collapse(focus.node, focus.offset);
            

            
            return true;
        }else if(is_H1to6(parent.tagName)){            
            if(node !== parent.firstChild ) return false;
            const head_word = node.data.substring(0,offset);
            
        
            let tagrank = 0;
            switch(head_word){
                case "#": tagrank = 1; break;
                case "##": tagrank = 2; break;
                case "###": tagrank = 3; break;
                case "####": tagrank = 4; break;
                case "#####": tagrank = 5; break;
                case "######": tagrank = 6; break;
            }
            if(tagrank === "none") return false;
            const myrank = parseInt(parent.tagName.charAt(1),10);
            tagrank += myrank;
            if(tagrank > 6) tagrank = 6;
            if(myrank === tagrank) return false;
            const tagname = "H" + tagrank.toString();

            undo_man.Begin(node, offset);
            const new_node = AddNode(tagname, parent.parentNode, parent);
            

            if(node.length !== offset){
                DivideTextNode(node, offset); //for remove head_word//
            }
            
            let focus;
            if(node.nextSibling){
                const fragment = RemoveNodeList(parent, node.nextSibling, null );//not to need safe operation because this will be removed//
                focus = SafePushNodeList(new_node, fragment);
            }else{
                AddNode("BR", new_node, null);
                focus = {node: new_node, offset : 0};
            }        
            RemoveNode(parent);

            undo_man.End(focus.node, focus.offset);
            document.getSelection().collapse(focus.node, focus.offset);
          

            
            return true;
        }
    }


    return false;       
}



/*
    make the rank of list down.
*/
function SwitchInputTab( node, offset) {
    if (node === null) return false;
    if(offset > 0) return false;
   
    
    if (node.nodeType === Node.TEXT_NODE) {
        
        if(node.previousSibling) return false;
        node = node.parentNode;
    }

    if(node.nodeName==="SPAN"){
        let parent = node.parentNode;
        while(parent.nodeName==="SPAN"){
            node = parent;
            parent = node.parentNode;
        }
        offset = GetIndex(parent, node);
        if(offset > 0) return false;
        node = parent;
    }
    
    if(node.nodeName==="LI"){

        //here node is li node//
        //this li node is moves to child rank//
        const prev = node.previousSibling;
        if(prev===null) return false;

        undo_man.Begin(node, offset);

        let joint_target_list = null;
        if((prev.lastChild.nodeName==="OL") || (prev.lastChild.nodeName==="UL")){
            //prev li has child list//
            joint_target_list = prev.lastChild;        
        }else{
            //prev li does not have child list//
            joint_target_list = AddNode(node.parentNode.tagName, prev, null);
        }

        const frag = RemoveNodeList(node.parentNode, node, node.nextSibling); //not to need safe operation because target parent(node.parentNode) is OL/UL//
        AddNodeList(joint_target_list, null, frag);//not to need safe operation because target parent(node.parentNode) is OL/UL//

        undo_man.End(node, 0);
        document.getSelection().collapse(node,0);
                
        return true;
    }else if((node.nodeName >= "H1") && (node.nodeName < "H6")){

        undo_man.Begin(node, offset);

        const next_tag = "H" + (1 + parseInt(node.nodeName.charAt(1),10)).toString();
        const next_H = AddNode(next_tag, node.parentNode, node);
        
        const frag = RemoveNodeList(node, node.firstChild); //not to need safe operation because this will be removed//
        const focus = SafePushNodeList(next_H, frag);
        RemoveNode(node)

        undo_man.End(focus.node, focus.offset);
        document.getSelection().collapse(focus.node, focus.offset);
                
        return true;
    }

    return false;
}

/*
    make the rank of list up.
*/
function SwitchInputShiftTab( node, offset) {
    if (node === null) return false;
    if(offset > 0) return false;
    
    if (node.nodeType === Node.TEXT_NODE) {
        
        if(node.previousSibling) return false;
        node = node.parentNode;
    }

    if(node.nodeName==="SPAN"){
        let parent = node.parentNode;
        while(parent.nodeName==="SPAN"){
            node = parent;
            parent = node.parentNode;
        }
        offset = GetIndex(parent, node);
        if(offset > 0) return false;
        node = parent;
    }
    
    if(node.nodeName==="LI") {

        //here node is li node//
        //this li node is moves to parent rank//
        //const prev = node.previousSibling;
        //if(prev===null) return false;

        undo_man.Begin(node, offset);

        const pp = node.parentNode.parentNode;
        if (pp.nodeName==="LI"){
            //rank up to the upper list//
            const ref = pp.nextSibling;
            const joint_ol = pp.parentNode;
            const org_ol = node.parentNode;
            if(node.nextSibling){
                const frag2 = RemoveNodeList(org_ol, node.nextSibling ); //not to need safe operation because target parent is OL/UL//
                if((node.lastChild.nodeName!=="OL") && (node.lastChild.nodeName!=="UL")){
                    AddNode(org_ol.tagName, node, null);
                }
                AddNodeList(node.lastChild, null, frag2); //not to need safe operation because target parent is OL/UL//
            }

            const frag = RemoveNodeList(org_ol, node, node.nextSibling); //not to need safe operation because target parent is OL/UL//
            AddNodeList(joint_ol, ref, frag); //not to need safe operation because target parent is OL/UL//
            if(!org_ol.hasChildNodes()){
                RemoveNode(org_ol);
            }

            undo_man.End(node, 0);
            document.getSelection().collapse(node,0);
        }else{ //pp is div(master)//
            //rank up to the p node//
            const org_ol = node.parentNode;
            const p_node = AddNode("P", pp, org_ol.nextSibling);
            const frag2 = (node.nextSibling) ? RemoveNodeList(org_ol, node.nextSibling) : null; //not to need safe operation because target parent is OL/UL//

            let end_line = node.firstChild;
            while(end_line){
                if(end_line.nodeName === "OL")break;
                if(end_line.nodeName === "UL")break;
                end_line = end_line.nextSibling;
            }
            const frag = RemoveNodeList(node, node.firstChild, end_line); //not to need safe operation because target parent will be removed//
            const focus = SafePushNodeList(p_node, frag);

            if(end_line){            
                const later_target_ol = node.lastChild;
                const frag3 = RemoveNodeList(node, end_line);//not to need safe operation because target parent will be removed//
                AddNodeList(pp,  p_node.nextSibling, frag3); //not to need safe operation because target parent is DIV(master)//
                if(frag2){
                    AddNodeList(later_target_ol, null, frag2);//not to need safe operation because target parent is OL/UL//
                }
            }else{
                if(frag2){
                    const later_target_ol = AddNode(org_ol.tagName, pp, p_node.nextSibling);
                    AddNodeList(later_target_ol, null, frag2);//not to need safe operation because target parent is OL/UL//
                }
            }
            
            RemoveNode(node);
            if(!org_ol.hasChildNodes()){
                RemoveNode(org_ol);
            }
            if(p_node.firstChild.nodeType==Node.TEXT_NODE){
                if(p_node.firstChild.data==nt_ZWBR){
                    if(IsSpanMathImg(p_node.firstChild.nextSibling)){
                        ConvertPtoFigure(p_node);                        
                    }else if (IsSpanMathCite(p_node.firstChild.nextSibling)){
                        ConvertMathCiteToRef(p_node.firstChild.nextSibling);                
                    }
                }
            }

            document.getSelection().collapse(focus.node, focus.offset);
            undo_man.End(focus.node, focus.offset);
        }
        
        return true;
    
    }else if((node.nodeName > "H1") && (node.nodeName <= "H6")){
        
        undo_man.Begin(node, offset);

        const next_tag = "H" + (parseInt(node.nodeName.charAt(1),10) - 1).toString();
        const next_H = AddNode(next_tag, node.parentNode, node);
        
        const frag = RemoveNodeList(node, node.firstChild);//not to need safe operation because node will be removed//
        const focus = SafePushNodeList(next_H, frag);
        RemoveNode(node)

        undo_man.End(focus.node, focus.offset);
        document.getSelection().collapse(focus.node, focus.offset);
                
        return true;
    }
    return false;
}

function SelectAll(maindiv){
    const selection = document.getSelection();
    selection.setBaseAndExtent(
        maindiv.firstChild, 0,
        maindiv.lastChild, maindiv.lastChild.childNodes.length);
}

function CorrectFocusToText(node, offset){    
    
    if(node.nodeType===Node.TEXT_NODE){
        return [node, offset];
    }
    
    if(! node.hasChildNodes()){
       return [node.parentNode, GetIndex(node.parentNode, node)];
    }

    if(node.childNodes.length <= offset){
    
        //end of node//
        while(node.lastChild){
            node = node.lastChild;            
            if(node.nodeType===Node.TEXT_NODE){
                return [node, node.length];
            }
        }
        return [node.parentNode, node.parentNode.childNodes.length];

    }
    
    if((node.nodeName==="SPAN") && (node.className==="math")){
        const text_node = node.lastChild.firstChild;
        return [text_node, 0];
    }

    node = node.childNodes.item(offset);
    while(node.nodeType!==Node.TEXT_NODE){        
        if(! node.hasChildNodes()){
            return [node.parentNode, offset];
        }    
        if((node.nodeName==="SPAN") && (node.className==="math")){
            const text_node = node.lastChild.firstChild;
            return [text_node, 0];
        }

        offset = 0;
        node = node.firstChild;
    }
    return [node, 0];
    
}

function IsSpanMathImg(node){
    if(!node) return false;
    if(node.nodeName!=="SPAN") return false;
    if(node.className!=="math") return false;
    if(node.lastChild.className!=="editimg") return false;
    return true;
}



function ConvertPtoFigure(p_node){
    const figure = AddNode("FIGURE", p_node.parentNode, p_node);
    
    let i_end = p_node.firstChild;
    while(i_end){
        if(!IsSpanMathImg(i_end)){
            if(i_end.nodeType===Node.TEXT_NODE){
                if(i_end.data != nt_ZWBR) break;
            }else{            
                break;
            }
        } 
        i_end = i_end.nextSibling;
    }
    const fragment = RemoveNodeList(p_node, p_node.firstChild, i_end);//not to need safe operation because this p_nde will be removed//
    AddNodeList(figure, null, fragment);
    if(figure.firstChild.nodeType==Node.TEXT_NODE){
        RemoveNode(figure.firstChild);
    }
    if(figure.lastChild.nodeType==Node.TEXT_NODE){
        RemoveNode(figure.lastChild);
    }

    const figcaption = AddNode("FIGCAPTION", figure, null);
    if(p_node.firstChild){
        const fragment2 = RemoveNodeList(p_node, p_node.firstChild, null);//not to need safe operation because this p_nde will be removed//
        SafePushNodeList(figcaption, fragment2);
    }else{
        AddNode("BR",figcaption,null);
    }
    RemoveNode(p_node);

    return figure;
}

/*
    deplicated not used
*/
function ConvertFiguretoP(figure){
    const p_node = AddNode("P", figure.parentNode, figure);
    
    let i_end = figure.firstChild;
    while(i_end){
        if(i_end.nodeName === "FIGCAPTION") break;
        i_end = i_end.nextSibling;
    }
    if(figure.firstChild !== i_end){
        const fragment = RemoveNodeList(figure, figure.firstChild, i_end);//not to need safe operation because this will be removed//
        SafePushNodeList(p_node, fragment);
    }

    if(i_end){
        if(i_end.hasChildNodes()){
            const fragment2 = RemoveNodeList(i_end, i_end.firstChild, null);//not to need safe operation because this i_end will be removed//
            SafePushNodeList(p_node, fragment2);        
        }
    }

    if( ! p_node.hasChildNodes()){
        AddNode("BR",p_node,null);
    }
    RemoveNode(figure);

    if(IsSpanMathCite(p_node.firstChild.nextSibling)){
        ConvertMathCiteToRef(p_node.firstChild.nextSibling);
    }

    return p_node;
}


function IsSpanMathCite(node){
    if(!node) return false;
    if(node.nodeName!=="SPAN") return false;
    if(node.className!=="math") return false;
    if(node.lastChild.className!=="editcite") return false;
    return true;
}

function ConvertMathCiteToRef(math_cite){
    
    const frag = new DocumentFragment();
    //const math = document.createElement("SPAN");
    //math.className = "math";
    const preview = document.createElement("SPAN");
    preview.className = "previewref";
    const text = math_cite.lastChild.firstChild.data;
    preview.appendChild(document.createTextNode(text.slice(2,text.length-2)));
    frag.appendChild(preview);
    const edit = document.createElement("SPAN");
    edit.className = "editref";
    edit.appendChild(document.createTextNode(text.slice(0,text.length-1)+":"));
    frag.appendChild(edit);
    SetHide(frag.lastChild);
    RemoveNode(math_cite.firstChild);
    RemoveNode(math_cite.firstChild);
    AddNodeList(math_cite, null, frag);//this becomes safe by the following SafeJunctionPoint//    
    
}

function IsSpanMathRef(node){
    if(!node) return false;
    if(node.nodeName!=="SPAN") return false;
    if(node.className!=="math") return false;
    if(node.lastChild.className!=="editref") return false;
    return true;
}

function ConvertMathRefToCite(math_ref){

    const frag = new DocumentFragment();
    const preview = document.createElement("A");
    preview.className = "previewcite";
    const text = math_ref.lastChild.firstChild.data;
    preview.appendChild(document.createTextNode(text.slice(2,text.length-2)));
    preview.href="#" + text.slice(2,text.length-2);        
    frag.appendChild(preview);
    const edit = document.createElement("SPAN");
    edit.className = "editcite";
    edit.appendChild(document.createTextNode(text.slice(0, text.length-1)+" "));
    frag.appendChild(edit);
    SetHide(math.lastChild);
    const math_next = math_ref.nextSibling;
    RemoveNode(math_ref.firstChild);
    RemoveNode(math_ref.firstChild);
    AddNodeList(math_ref, null, frag);
}

/*
Input "|" 
*/
function SwitchInputBar(node, offset) {
    if (node === null) return false;

     

    let already_begun = false;
    
    if (node.nodeType === Node.TEXT_NODE) {
        switch (node.parentNode.tagName) {
            case "P": //to make new table//
                {
                    if(offset === 0) return false;
                    
                    //get table size//
                    const [col_size, row_size] = GetTableSize(node.data.slice(0,offset));
                    if((col_size <= 0) || (row_size <= 0) )return false;

                    undo_man.Begin(node, offset);
                    const table = ConvertPtoTable(node.parentNode, col_size, row_size);
                    const fnode = table.firstChild.firstChild;
                    undo_man.End(fnode, 0);
                    document.getSelection().collapse(fnode, 0);
                    return true;

                }
                break;
            case "TH":   //to split column//
            case "TD":
                {
                    if (offset === 0) {
                        console.log("go to divide node: " + node.parentNode.tagName);
                        undo_man.Begin(node, offset);
                        already_begun = true;

                        offset = GetIndex(node.parentNode, node);
                        node = node.parentNode;
                    } else if (offset === node.length) {
                        console.log("go to divide node: " + node.parentNode.tagName);
                        undo_man.Begin(node, offset);
                        already_begun = true;

                        offset = GetIndex(node.parentNode, node) + 1;
                        node = node.parentNode;
                    } else {
                        undo_man.Begin(node, offset);
                        already_begun = true;

                        DivideTextNode(node, offset);

                        offset = GetIndex(node.parentNode, node) + 1;
                        node = node.parentNode;                        
                    }
                }
                break;
            /*    
            case "SPAN":           
                if(IsTextNodeInMath(node)){
                    const math = node.parentNode.parentNode;
                    if((math.parentNode.nodeName !=="TH") && (math.parentNode.nodeName!=="TD") ){
                        return false;
                    }
                    if(offset === 0){
                        undo_man.Begin(node, offset);
                        already_begun = true;
                        node = math.parentNode;
                        offset = GetIndex(node, math);     
                        DisableEdit(math);                                           
                        
                        break;
                    }else if (offset === node.length){
                        undo_man.Begin(node, offset);
                        already_begun = true;
                        node = math.parentNode;
                        offset = GetIndex(node, math) + 1;
                        DisableEdit(math);
                        break;
                    }
                }
                return false;
            */    
            default:
                //nothing to do for span.math, span.inline and so on//
                return false;
        }        
    }

    

    switch (node.tagName) {
        case "TH":
            {
                if (! already_begun ) {
                    undo_man.Begin(node, offset);
                }

                const org_tr = node.parentNode;
                const table = org_tr.parentNode;

                let new_td = null;
                let focus;
                if(offset < node.childNodes.length){
                    
                    const fragment = SafeRemoveNodeList(node, node.childNodes.item(offset), null);
                    new_td = AddNode(node.tagName, node.parentNode, node.nextSibling);
                    focus = SafePushNodeList(new_td, fragment);


                    if(!node.hasChildNodes()){
                        AddNode("BR", node, null);                    
                    }
                }else{
                    new_td = AddNode(node.tagName, node.parentNode, node.nextSibling);
                    AddNode("BR", new_td, null);
                    focus = {node: new_td, offset: 0};
                }


                //shift the td in second row or later//
                const begin_shilf = GetIndex(org_tr, node) + ((offset === 0) ? 0 : 1);
                const second_tr = org_tr.nextSibling;
                {//second row: copy the alignment text//
                    const begin_td = second_tr.childNodes.item(begin_shilf);
                    const td = AddNode("TD", second_tr, begin_td);
                    AddTextNode( begin_td.firstChild.data, td, null);
                }
                //third row or later: insert null td//
                for( let tr = second_tr.nextSibling; tr; tr = tr.nextSibling ){
                    const begin_td = tr.childNodes.item(begin_shilf);
                    const td = AddNode("TD", tr, begin_td);
                    AddNode("BR", td, null);
                }

                
                undo_man.End(focus.node, focus.offset);
                document.getSelection().collapse(focus.node, focus.offset);
                return true;
            
            }
        case "TD":
            {

                if (! already_begun ) {
                    undo_man.Begin(node, offset);
                }

                const org_tr = node.parentNode;
                const table = org_tr.parentNode;


                if(org_tr === table.firstChild.nextSibling){
                    undo_man.Cancel();
                    return true;
                }

                let new_td = null;
                let focus;
                if(offset < node.childNodes.length){
                    
                    const fragment = SafeRemoveNodeList(node, node.childNodes.item(offset), null);
                    new_td = AddNode(node.tagName, node.parentNode, node.nextSibling);
                    focus = SafePushNodeList(new_td, fragment);


                    if(!node.hasChildNodes()){
                        AddNode("BR", node, null);                    
                    }
                }else{
                    new_td = AddNode(node.tagName, node.parentNode, node.nextSibling);
                    AddNode("BR", new_td, null);
                    focus = {node: new_td, offset: 0};
                }
                
                
                const num_column = table.firstChild.childNodes.length;
                while(org_tr.childNodes.length > num_column){
                    RemoveNode(org_tr.lastChild);
                }
                    
                
                undo_man.End(focus.node, focus.offset);
                document.getSelection().collapse(focus.node, focus.offset);
                return true;
                
            }
            break;
        default:
            //alert("ERROR: Input Bar at " + node.nodeName);
            undo_man.Cancel();
            break;
    }
    undo_man.Cancel();
    return false;
}


/*
Input "^". In paticular, input into [] position
*/
function SwitchInputHat(node, offset) {
    if (node === null) return true;
    
    if(node.nodeType != Node.TEXT_NODE) return true;// for preventDefault() //
    
    if (IsTextNodeInMath(node)){
        if(["edita","editimg","editcite","editref"].includes(node.parentNode.className)){
            return true; // for preventDefault() //
        }
    }
    
    //here, node is TEXT //
    if(node.data.charAt(offset-1) != '[') return false;
    const pos_sq_bra = offset-1;

    let cut_end = node.data.indexOf(']', offset);
    let sq_text;
    if(cut_end < 0){ //cannot find round ket ')' //
        cut_end = offset;
        sq_text = node.data.slice(pos_sq_bra, offset) + "^] ";
    }else{
        cut_end++;
        sq_text = node.data.slice(pos_sq_bra, offset) + "^" + node.data.slice(offset, cut_end) + " ";
    }

    undo_man.Begin(node, offset);
    let rm_node = node;
    if(cut_end < node.length){
        DivideTextNode(node, cut_end);
    }

    if(pos_sq_bra > 0){
        rm_node = DivideTextNode(node, pos_sq_bra);
    }

    const math = AddMathNode('[^', node.parentNode, rm_node);
    
    RemoveNode(rm_node);
    SafeJunctionPoint(math.parentNode, math);
    SafeJunctionPoint(math.parentNode, math.nextSibling);

    const math_text = math.lastChild.firstChild;
    InsertTextIntoText(sq_text, math_text, 0);
    DeleteText(math_text, sq_text.length, math_text.length);

    if(math.parentNode.nodeName == "P"){
        if(math.previousSibling.data == nt_ZWBR){
            if(math.previousSibling.previousSibling===null){                
                ConvertMathCiteToRef(math);
            }
        }
    }

    
    const focus = EnableMathEdit(math, offset - pos_sq_bra + 1);
    document.getSelection().collapse(focus.node, focus.offset);
    undo_man.End(focus.node, focus.offset);

    
    return true;  // to default input //
}


function SwitchInputRoundBra(node, offset) {
    if (node === null) return true;    
    
    if(node.nodeType != Node.TEXT_NODE) return false; //expecting BR node, to default input //
    
    if (IsTextNodeInMath(node)) return false;
    
    //here, node is TEXT //
    
    if(node.data.charAt(offset-1) != ']') return false;
    let pos_sq_bra = node.data.lastIndexOf('[', offset-1);
    if(pos_sq_bra < 0) return false;

    let is_img = false;
    if(node.data.charAt(pos_sq_bra-1) == '!') {
        pos_sq_bra--; //check img tag//
        is_img = true;
    }
    
    let cut_end = node.data.indexOf(')', offset);
    let sq_text;
    if(cut_end < 0){ //cannot find round ket ')' //
        cut_end = offset;
        sq_text = node.data.slice(pos_sq_bra, offset) + "()";
    }else{
        cut_end++;
        sq_text = node.data.slice(pos_sq_bra, offset) + "(" + node.data.slice(offset, cut_end);
    }
    if(is_img){
        sq_text += " ";
    }
    
    undo_man.Begin(node, offset);
    let rm_node = node;
    if(cut_end < node.length){
        DivideTextNode(node, cut_end);
    }

    if(pos_sq_bra > 0){
        rm_node = DivideTextNode(node, pos_sq_bra);
    }

    const math = AddMathNode((is_img) ? '![' : '[', node.parentNode, rm_node);
    
    RemoveNode(rm_node);
    SafeJunctionPoint(math.parentNode, math);
    SafeJunctionPoint(math.parentNode, math.nextSibling);

    const math_text = math.lastChild.firstChild;
    InsertTextIntoText(sq_text, math_text, 0);
    DeleteText(math_text, sq_text.length, math_text.length);

    if(math.parentNode.nodeName == "P"){
        if(math.previousSibling.data == nt_ZWBR){
            if(math.previousSibling.previousSibling===null){                
                ConvertPtoFigure(math.parentNode);
            }
        }
    }

    
    const focus = EnableMathEdit(math, offset - pos_sq_bra + 1);
    document.getSelection().collapse(focus.node, focus.offset);
    undo_man.End(focus.node, focus.offset);
            
    return true;
}




function ConvertPtoTable(p_node, col_size, row_size){
    const table = AddNode("TABLE", p_node.parentNode, p_node);
    {//header//
        const tr = AddNode("TR", table, null);
        for(let i = 0; i < col_size; ++i){
            const th = AddNode("TH", tr, null);
            AddNode("BR", th, null);
        }    
    }

    {//border//
        const tr = AddNode("TR", table, null);
        for(let i = 0; i < col_size; ++i){
            const td = AddNode("TD", tr, null);
            AddTextNode("---", td, null);
        }    
    }
    
    //tbody//
    for(let k = 1; k < row_size; ++k){
        const tr = AddNode("TR", table, null);
        for(let i = 0; i < col_size; ++i){
            const td = AddNode("TD", tr, null);
            AddNode("BR", td, null);
        }    
    }
    RemoveNode(p_node);

    return table;
}


function GetTableSize(text){
    if(text[0] !== '|') return [0,0];

    const length = text.length;
    let i = 1;
    while( text[i]===' '){ 
        ++i; 
        if(i === length) return[0,0];
    }
    const num1_begin = i;
    
    while(('0' <= text[i] ) && ( text[i] <= '9' ) ){ 
        ++i; 
        if(i === length) return[0,0];
    }
    const num1_end = i;

    while( text[i]===' '){ 
        ++i; 
        if(i === length) return[0,0];
    }
    if((text[i]!=='x') && (text[i]!==',') ) return [0,0];
    
    ++i;
    while( text[i]===' '){ 
        ++i; 
        if(i === length) return[0,0];
    }
    
    const num2_begin = i;
    
    while(('0' <= text[i] ) && ( text[i] <= '9' ) ){ 
        ++i; 
        if(i === length) break;
    }
    if(i===num2_begin) return [0,0];
    const num2_end = i;

    while( i < length ){
        if(text[i]!==' ') return [0,0];
        ++i;         
    }

    const num1 = parseInt(text.slice(num1_begin, num1_end), 10);
    const num2 = parseInt(text.slice(num2_begin, num2_end), 10);

    return [num1,num2];


}



function SwitchInputArrowUp(td){
    const tr = td.parentNode;

    if(tr.previousSibling===null){ //creat new line before table if table is the first node in page//
        const table = tr.parentNode;
        if(table.previousSibling===null){
            undo_man.Begin(document.getSelection().focusNode, document.getSelection().focusOffset);
            const p = AddNode("P", table.parentNode, table);
            AddNode("BR", p, null);
            document.getSelection().collapse(p, 0);
            undo_man.End(p, 0);
            return true;
        }
        return false;
    } 

    const index = GetIndex(tr, td);
    const adj_td = tr.previousSibling.childNodes.item(index);
    const focus = FocusOffsetLast(adj_td);
    document.getSelection().collapse(focus.node, focus.offset);
    return true;
}

function SwitchInputArrowDown(td){
    const tr = td.parentNode;
    if(tr.nextSibling===null){ //creat new line after table if table is the last node in page//
        const table = tr.parentNode;
        if(table.nextSibling===null){
            undo_man.Begin(document.getSelection().focusNode, document.getSelection().focusOffset);
            const p = AddNode("P", table.parentNode, null);
            AddNode("BR", p, null);
            document.getSelection().collapse(p, 0);
            undo_man.End(p, 0);
            return true;
        }
        return false;
    }

    const index = GetIndex(tr, td);
    const adj_td = tr.nextSibling.childNodes.item(index);
    const focus = FocusOffsetLast(adj_td);
    document.getSelection().collapse(focus.node, focus.offset);
    return true;
}
