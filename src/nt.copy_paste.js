"use strict";



function OnCut(event){
    console.log("fook cut on " + event.currentTarget);
    event.preventDefault();

    let fragment = CutSelection(event.currentTarget, document.getSelection());
    if(fragment===null) return;

    if(event.clipboardData){
        let md_text = DOM2MD(fragment);
        event.clipboardData.setData("text/plain", md_text);
        
        let temp =  document.createElement("DIV");
        temp.appendChild(fragment);        
        console.log("copy to clipboard as html: " + temp.innerHTML);

        console.log("copy to clipboard as markdown: " + md_text);
    }
           
}

function OnCopy(event){
    console.log("fook copy on " + event.currentTarget);
    event.preventDefault();
    
    if(event.clipboardData){
        undo_man.GetChangeEventDispatcher().Disable();
        const fragment = CutSelection(event.currentTarget, document.getSelection());
        if(fragment){
            ExecUndo();
        }
        undo_man.Shrink();
        undo_man.GetChangeEventDispatcher().Enable();
        if(fragment===null) return;

        const md_text = DOM2MD(fragment);
        event.clipboardData.setData("text/plain", md_text);
        
        const temp =  document.createElement("DIV");
        temp.appendChild(fragment);        
    }
           
}

function OnPaste(event){
    console.log("fook paste on " + event.currentTarget);
    event.preventDefault();
    
    const clipboardData = event.clipboardData;

    if(clipboardData ){
        let text = clipboardData.getData("text/plain");
        console.log(text);

        const selection = document.getSelection();
        if (!selection.isCollapsed) {
            CutSelection(event.currentTarget, selection);
        }

        const [node,offset] = CorrectFocusToText(selection.focusNode, selection.focusOffset);
        if(IsTextNodeInMath(node)){
            if((0 < offset) && (offset < node.length)){
                //here, escape sequence should applied into text//
                
                undo_man.Begin(node,offset);
                InsertTextIntoText(text, node, offset);
                undo_man.End(node,offset + text.length);
                return;
            }
        }

        const fragment = MD2DOM(text);        
        InitializeMathInFragment(fragment, g_auto_numbering ? 1 : 0);
        PasteTopLevelNodes(node, offset, fragment, event.currentTarget);

    }
           
}

/***
 * Cut the dom list as fragment that are selected by focus and anchor 
 * 
 * note:
 * focusNode, and anchorNode is not better because their order can be negative.
 * Range.startContainer and Range.endContainer is better 
 * since Range.startContainer is surely placed before Range.endContainer .
 * 
***/
function CutSelection(master_node, selection){

    if(selection.isCollapsed){return null};
    if(selection.rangeCount === 0){return null;}
    
    const range = selection.getRangeAt(0);
    const start_node = range.startContainer;
    const start_offset = range.startOffset;
    let end_node = range.endContainer;
    let end_offset = range.endOffset;



    
    // actual dom operation begins from here///////////////////////////////

    undo_man.Begin( selection.focusNode,  selection.focusOffset,  selection.anchorNode, selection.anchorOffset);

        {//check in simple text node
            if((start_node) && (start_node === end_node)){
                if(start_node.nodeType===Node.TEXT_NODE){
                    
                    if((start_offset === 0) && (end_offset===start_node.length)){
                        const parent = start_node.parentNode;
                        const next = start_node.nextSibling;
                        const frag = new DocumentFragment();
                        frag.appendChild( RemoveNode(start_node));
                        const focus = SafeJunctionPoint(parent, next);      
                        undo_man.End(focus.node, focus.offset);
                        document.getSelection().collapse(focus.node, focus.offset);
                        return frag.cloneNode(true);
                        
                    }else{
                        console.log("start_node", start_node);
                        const text = DeleteText(start_node, start_offset, end_offset - start_offset);
                        document.getSelection().collapse(start_node, start_offset);     
                        undo_man.End(start_node, start_offset);
                        
                        const frag = new DocumentFragment();
                        frag.appendChild( document.createTextNode(text));                        
                        return frag.cloneNode(true);
                    }
                }
            }
        }
        

    //here, cut nodes composed of multi-nodes// 

    //後ろから先に処理をするべし, 前方でDivideNodeした際にOffsetがズレるため。
    let init_parent2;
    let init_ref2;    
    if(end_node.nodeType===Node.TEXT_NODE){
        init_parent2 = end_node.parentNode;        
        if(end_offset === 0){
            init_ref2 = end_node;    
        }else if(end_offset === end_node.length){
            init_ref2 = end_node.nextSibling;
        }else{
            //devide text node, which is deepest node//
            DivideTextNode(end_node,end_offset);
            init_ref2 = end_node.nextSibling;
        }
            
    }else{
        init_parent2 = end_node;    
        init_ref2=end_node.childNodes.item(end_offset);
    }

    let init_parent1;
    let init_ref1;
    if(start_node.nodeType===Node.TEXT_NODE){
        init_parent1 = start_node.parentNode;
        if(start_offset === 0){
            init_ref1 = start_node;    
        }else if(start_offset === start_node.length){
            init_ref1 = start_node.nextSibling;
        }else{
            //devide text node, which is deepest node//
            DivideTextNode(start_node,start_offset);
            init_ref1 = start_node.nextSibling;
        }
    }else{
        init_parent1 = start_node;
        init_ref1=start_node.childNodes.item(start_offset);        
    }

    

    //To find common parent node///////////////////////////// 
    const cross1 = MakeCrossSection(master_node, init_parent1);
    const cross2 = MakeCrossSection(master_node, init_parent2);

    //comparison to find most bottom node which has the differenet offsets of cross section// 
    // this routine may be replaced by "Range.commonAncestorContainer()" //
    let index1 = cross1.length-1;
    let index2 = cross2.length-1;
    
    let common_parent = master_node;
    while((index1>= 0) && (index2>= 0)){
        let ref1 = cross1[index1];
        let ref2 = cross2[index2];
        if(ref1 !== ref2){
            break;
        }
        common_parent = ref1;
        index1--;
        index2--;
    }
    //here, node at (index1 - 1) is same as node at at (index2 - 1).
    if((common_parent.tagName === "OL") || (common_parent.tagName === "UL")){
        common_parent = common_parent.parentNode;
    }
    
    console.log("common_parent: " + common_parent);

    // this order is important. 
    const ref_end = DivideAtCrossSection2( init_ref2, init_parent2, common_parent);
    const ref_begin = DivideAtCrossSection2( init_ref1, init_parent1, common_parent);
    

    
    if(ref_begin.nodeType===Node.TEXT_NODE){
        console.log("cut_node: " + ref_begin.data);
    }else{
        console.log("cut_node: " + ref_begin + " to " + ref_end);
    }
    let cut_fragment = RemoveNodeList(common_parent, ref_begin, ref_end);
    
    let focus;
    if(ref_end){
        focus = ConnectionNodeRecursive(ref_end);
    }else{
        focus = SafeJunctionPoint(common_parent, ref_end);
    }
    let next_focus_node = focus.node;
    let next_focus_offset = focus.offset;
    
    if(next_focus_node===null){
        next_focus_node = common_parent;
        next_focus_offset = GetIndex(common_parent, ref_end);
    }

    RecoveryEmptyElement(common_parent);
    RecoveryPandFigure(common_parent);
    if(( next_focus_node.nodeName === "DIV" )||
        ( next_focus_node.nodeName === "OL" )||
        ( next_focus_node.nodeName === "UL" )){
        next_focus_node = next_focus_node.firstChild;
        next_focus_offset = 0;
    }
    
    [next_focus_node, next_focus_offset] = CorrectFocusToText(next_focus_node, next_focus_offset);
    console.log("new focus: " + next_focus_node + ", " +  next_focus_offset);


    undo_man.End(next_focus_node, next_focus_offset);
    selection.collapse(next_focus_node, next_focus_offset);

    // end of actual dom operation begins from here///////////////////////////////
    const fragment_clone = cut_fragment.cloneNode(true);
    console.log("clone: " + fragment_clone);
    

    return fragment_clone;

}


function MakeCrossSection(master_node, init_parent){
    let cross_section=[];
    let node = init_parent;
    
    while(node !== master_node){        
        
        cross_section.push(node);
        node = node.parentNode;
    }
    cross_section.push(node);
    return cross_section;
}



function DivideAtCrossSection2( init_ref, init_parent, common_parent){
    let next_ref = init_ref;         
    let parent = init_parent;
    while(parent){     
        if(parent === common_parent) break;             

        const ref = next_ref; //because dividing//
        
        if(ref===parent.firstChild){
            //not to divide
            const new_node = AddNode(parent.tagName, parent.parentNode, parent);
            AddNode("BR", new_node, null);
            next_ref = parent;
        }else if(ref === null){
            //not to divide
            const new_node = AddNode(parent.tagName, parent.parentNode, parent.nextSibling);
            AddNode("BR", new_node, null);
            next_ref = parent.nextSibling; // === new_node//
        
        }else{
            
            const simple_parents = ["P","H1","H2","H3","H4","H5","H6","LI","FIGURE","FIGCAPTION","TD","TH"];
            if(simple_parents.includes(parent.tagName)){
                const fragment = SafeRemoveNodeList(parent, ref, null);
                const parent_next = AddNode(parent.tagName, parent.parentNode, parent.nextSibling);
                SafePushNodeList(parent_next, fragment);
                next_ref = parent_next;
            }else{
                const fragment = RemoveNodeList(parent, ref, null);
                const parent_next = AddNode(parent.tagName, parent.parentNode, parent.nextSibling);
                AddNodeList(parent_next, null, fragment);
                next_ref = parent_next;
            }
            
        }

        parent = parent.parentNode;
    }
    return next_ref;
}


/***
 * If the node(element, not text) which does not have child is found, <br>, <li><br/></li>, or <p><br/></p> is added into child.
 * This function is recursive function. 
 ***/
function RecoveryEmptyElement(node){


    switch(node.tagName){
    case "P":
    case "H1":
    case "H2":
    case "H3":
    case "H4":
    case "H5":
    case "H6":
    case "TH":
    case "TD":
    case "FIGCAPTION":
            {
            if(node.firstChild===null){
                AddNode("BR", node, null);
            }
            /*if( node.lastChild.nodeName !== "BR"){
                AddNode("BR", node, null);
            }*/
        }
        break;
    case "LI":
            {
                if(node.firstChild===null){
                    AddNode("BR", node, null);
                }else{
                    let ch = node.firstChild;
                    if ((ch.nodeName === "OL")|| (ch.nodeName === "UL")){
                        AddNode("BR", node, ch);   
                    }/*
                    else{
                        let ch_prev = ch;
                        ch = ch.nextSibling;                    
                        while(ch){
                            if ((ch.nodeName === "OL")|| (ch.nodeName === "UL")){
                                if(ch_prev.nodeName !== "BR"){
                                    AddNode("BR", node, ch);            
                                }      
                                break;                   
                            }
                            ch_prev = ch;
                            ch = ch.nextSibling;
                        }
                    }
                    */
                    for(let a = node.firstChild; a !== null; a=a.nextSibling){
                        RecoveryEmptyElement(a);
                    }
                }

            }
            break;
    case "OL":
    case "UL":
        {
            if(node.firstChild===null){
                AddNode("LI", node, null);
                AddNode("BR", node.firstChild, null);
            }else{

                for(let a = node.firstChild; a !== null; a=a.nextSibling){
                    RecoveryEmptyElement(a);
                }
            }
        }
        break;
    case "DIV":
        {
            if(node.firstChild===null){
                AddNode("P", node, null);
                AddNode("BR", node.firstChild, null);
            }else{

                for(let a = node.firstChild; a !== null; a=a.nextSibling){
                    RecoveryEmptyElement(a);
                }
            }
        }
        break;
    default:
        {
            for(let a = node.firstChild; a !== null; a=a.nextSibling){
                RecoveryEmptyElement(a);
            }
        }
        break;
    }

}



function RecoveryPandFigure(node){

    switch(node.nodeName){
    case "P":
        {
            if(node.firstChild.nodeType===Node.TEXT_NODE){
                if(node.firstChild.data == nt_ZWBR){
                    if(IsSpanMathImg(node.firstChild.nextSibling)){
                        ConvertPtoFigure(node);
                    }
                }
            }else if(IsSpanMathImg(node.firstChild)){
                ConvertPtoFigure(node);
            }
        }
        break;
    case "FIGURE":
        {
            let is_figure = false;
            if(node.firstChild.nodeType===Node.TEXT_NODE){
                if(node.firstChild.data == nt_ZWBR){
                    if(IsSpanMathImg(node.firstChild.nextSibling)){
                        is_figure = true;
                    }
                }
            }else if(IsSpanMathImg(node.firstChild)){
                is_figure = true;
            }
            if(!is_figure){
                ConvertFiguretoP(node);
            }
        }
        break;
    case "DIV":
        {
            let next;
            for(let ch = node.firstChild; ch; ch = next){
                next = ch.nextSibling;
                if(ch.nodeName==="P"){
                    RecoveryPandFigure(ch);
                }else if(ch.nodeName==="FIGURE"){
                    RecoveryPandFigure(ch);
                }
            }            
        }
        break;
    }
}



/***
 * 
 * Connection at Cross Section
 * The nodes are connected recursively  
 * ref_node and prev_node (just before ref_node) is connected if they are same node.
 * 
 ***/
function ConnectionNodeRecursive(ref_node){
    let focus = {node: ref_node, offset: 0};
    

    while(ref_node) {
        const parent = ref_node.parentNode;
        if (ref_node.previousSibling===null) break;
        const prev = ref_node.previousSibling;

        let next_ref = null;

        if(ref_node.nodeName=="LI"){
            if(prev.nodeName != "LI"){
                break;
            }

            if(prev.lastChild){
                if((prev.lastChild.nodeName == "OL")||(prev.lastChild.nodeName == "UL")){
                    let latter_first_OL_UL = null;
                    if(ref_node.firstChild.nodeName=="BR"){
                        if(ref_node.firstChild.nextSibling){
                            if((ref_node.firstChild.nextSibling.nodeName=="OL")||(ref_node.firstChild.nextSibling.nodeName=="UL")){
                                latter_first_OL_UL = ref_node.firstChild.nextSibling;
                            }
                        }
                    }else if((ref_node.firstChild.nodeName=="OL")||(ref_node.firstChild.nodeName=="UL")){
                        latter_first_OL_UL = ref_node.firstChild;
                    }

                    if(latter_first_OL_UL){
                        if(latter_first_OL_UL.nodeName == prev.lastChild){
                            //combine OL/UL//

                            focus = {node: latter_first_OL_UL.firstChild, offset: 0};
                            const fragment = RemoveNodeList(latter_first_OL_UL, latter_first_OL_UL.firstChild, null);//not to need safe operation because of LI //
                            AddNodeList(prev.lastChild, null, fragment);//not to need safe operation because of LI //
                            RemoveNode(ref_node);
                            break;
                        }
                    }
                    
                    //here, prev.last is OL/UL and ref does not start by UL/OL. Therefore, LI is not combined//
                    
                    break;
                }
            }

            //connect LI. The former_last is simple, and lattter fist is OL/UL.//
            // And but, do not advance to connection of child LI//
            const fragment = RemoveNodeList(ref_node, ref_node.firstChild, null);//not to need safe operation because this will be removed //
            focus = SafePushNodeList(prev, fragment);
            RemoveNode(ref_node);
            


        }else if((ref_node.nodeName === "OL") || 
                (ref_node.nodeName === "UL") ){
            if(prev.nodeName != ref_node.nodeName) {
                break;
            }

            focus = {node: ref_node.firstChild, offset: 0};
            next_ref = ref_node.firstChild;
            const fragment = RemoveNodeList(ref_node, ref_node.firstChild, null);//not to need safe operation because of LI //
            const fnode = AddNodeList(prev, null, fragment);//not to need safe operation because of LI //
            RemoveNode(ref_node);
            
        }else if(ref_node.nodeName === "P"){
            if(prev.nodeName != ref_node.nodeName) {
                break;
            }
            focus = SafeCombineNode(prev);
        }

        ref_node = next_ref;

    }
    
    return focus;
}






/****************
 * Insert top level nodes (i.e. generated by MD2DOM) into current focus (node, offset)
 ****************/
function PasteTopLevelNodes(node, offset, fragment, master_node){
    console.log("try paste: ", node, ", ", offset);

    if(!fragment.hasChildNodes()) return;


    undo_man.Begin(node, offset);

    let parent;    
    let pos_after;
    if(node.nodeType===Node.TEXT_NODE){
        if(IsTextNodeInMath(node)){
            //in math//
            const math = node.parentNode.parentNode;
            if(offset === 0){
                parent = math.parentNode;
                pos_after = math;            
            }else if(offset===node.length){
                parent = math.parentNode;
                pos_after = math.nextSibling;            
            }else{
                //cancel input in math//
                undo_man.Cancel();
                return ;
            }
        }else{
            //plane text node
            if(offset == 0){
                parent = node.parentNode;
                pos_after = node;            
            }else if(offset < node.length){
                parent = node.parentNode;
                pos_after = DivideTextNode(node, offset);
            }else{
                parent = node.parentNode;
                pos_after = node.nextSibling;            
            }
        }
    }else if(node.hasChildNodes()){
        if((node.nodeName == "OL") || (node.nodeName == "UL")){
            parent = node.childNodes.item(offset);
            pos_after = parent.firstChild;
        }else{
            parent = node;
            pos_after = node.childNodes.item(offset);        
        }        
    }else{//such as BR//
        parent = node.parentNode;
        pos_after = node;
    }

    
    //paste as simple text line (single one line (data is children of p node), and it does not include list )//
        
    if(fragment.childNodes.length == 1){
        const indepenent_tag = ["P","H1","H2","H3","H4","H5", "H6", "LI", "TH","TD","FIGCAPTION"];//without LI//
        
        if (indepenent_tag.includes(fragment.firstChild.nodeName)) {
        
    
            const frag = FragmentFromChildren(fragment.firstChild);        
            const begin_pos = AddNodeList(parent, pos_after, frag);//this becoes safe by the following safe methods//
            SafeJunctionPoint(parent,begin_pos);
            const focus = SafeJunctionPoint(parent,pos_after);
            
            document.getSelection().collapse(focus.node, focus.offset);  

            RecoveryPandFigure(parent);
            
            undo_man.End(focus.node, focus.offset);
        
            console.log("paste succsess as simple text line");
            return;
        }
    }
    


    if(parent.tagName === "LI"){
        let fragment_for_li = null;
        if(fragment.childNodes.length == 1){
            if((fragment.firstChild.nodeName=="OL")||(fragment.firstChild.nodeName=="UL")){
                //the li is picked up and insert the current LI//
                fragment_for_li = FragmentFromChildren(fragment.firstChild);

            }
        }else{
            //check the fragment is composed only of P, H1, OL, UL//
            let can_be_regarded_as_LI = true;
            for(let node = fragment.firstChild; node; node=node.nextSibling){
                if(!( ["P","H1","H2","H3","H4","H5","H6","OL","UL"].includes(node.nodeName))){
                    can_be_regarded_as_LI = false;
                }
            }

            //P,H1 are transformed to LI, OL, UL are changed into child of the previus LI//
            if(can_be_regarded_as_LI){
                            
                fragment_for_li = new DocumentFragment();
                let prev_li = null;
                let next;
                for(let node = fragment.firstChild; node; node = next){
                    next = node.nextSibling;
                    if((node.nodeName=="OL")||(node.nodeName=="UL")){
                        if(prev_li===null){
                            const li = document.createElement("LI");
                            li.appendChild(document.createElement("BR"));
                            li.appendChild(fragment.removeChild(node));
                            fragment_for_li.appendChild(li);
                        }else{
                            prev_li.appendChild(fragment.removeChild(node));
                        }
                        prev_li = null;
                        
                    }else{ //P, H2
                        const li = document.createElement("LI");
                        li.appendChild( FragmentFromChildren(node));
                        fragment_for_li.appendChild(li);
                        prev_li = li;
                    }
                }

            }
        }

        //Top level nodes can be inserted into li 
        if(fragment_for_li){
            //to divide li node at the focus position//
            const fragment = SafeRemoveNodeList(parent, pos_after, null);
            const parent_next = AddNode(parent.tagName, parent.parentNode, parent.nextSibling);
            SafePushNodeList(parent_next, fragment);

            //insert paste elements, here parent.parentNode is OL/UL //
            const paste_begin = AddNodeList(parent.parentNode, parent_next, fragment_for_li);//this is safe because LI is added//
            ConnectionNodeRecursive(paste_begin);
            const focus = ConnectionNodeRecursive(parent_next);
            
            undo_man.End(focus.node, focus.offset);
            document.getSelection().collapse(focus.node, focus.offset);
            console.log("paste succsess as list");
            return;
        }


    
    }


    if(["LI","P","H1","H2","H3","H4","H5","H6","FIGURE","FIGCAPTION"].includes(parent.nodeName)){
        
        const ref_node = DivideAtCrossSection2( pos_after, parent, master_node);
        
        const ref_first = AddNodeList(master_node, ref_node, fragment);//this becoes safe by the following ConnectionNodeRecursive//   
        
        ConnectionNodeRecursive(ref_first);
        const focus = (ref_node) ? ConnectionNodeRecursive(ref_node) : SafeJunctionPoint(parent, ref_node);
        
        RecoveryPandFigure(master_node);

        undo_man.End(focus.node, focus.offset);
        document.getSelection().collapse(focus.node, focus.offset);
        console.log("paste succsess as paragrafh ");
        return;
    }
    
    undo_man.Cancel();
    console.log("paste is skiped");

}

function FragmentFromChildren(parent){
    const frag = new DocumentFragment();
    while(parent.firstChild){
        frag.appendChild(parent.removeChild(parent.firstChild));
    }
    return frag;
}

