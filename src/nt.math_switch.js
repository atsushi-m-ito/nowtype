"use strict";
/*

Specification of math node, which is SPAN tag and its className === "math".
The math node has two children. 
The firstChild is preview node generated by katex.
The lastChild is editable node to write the text of math expression.

And , math node has two kinds of type, which are "inline math" and "display math". 
The latter is shown in independent line.
When math node is for the inline math, the lastChild.className === "editmath". 
When math node is for the displat math, the lastChild.className === "editmathdisp"

And the math node for the displat math has original property "data-eqnumber-begin" and "data-eqnumber-end". 
These has the equation number for auto numbering of katex (our extention).
Accsess by math.dataset.eqnumberBegin, and math.dataset.eqnumberEnd, respectively.

*/





let g_editable_math = null;
let g_auto_numbering = true;

function OnClick(event){
    if(nt_selected_cell) return false;

    if(!CorrectSelectionEdgeTable()){
        event.preventDefault();
        return false;
    }

    if(event.shiftKey && event.ctrlKey){
        //select whole table //
        const node  = document.elementFromPoint(event.clientX, event.clientY);
        const td = CheckNodeInTD(node, nt_render_div);
        if(td){
            const table = td.parentNode.parentNode;
            const parent = table.parentNode;
            event.preventDefault();
            const index = GetIndex(parent, table);
            document.getSelection().setBaseAndExtent(parent, index, parent, index+1);
            return false;
        }
    }

    OnClickMath(event); 
}


function OnClickMath(event){
    const selection = document.getSelection();
    

    let clicked_node  = document.elementFromPoint(event.clientX, event.clientY);
    let focus_math = CheckNodeInClass(clicked_node,"math", nt_render_div);
    if(focus_math === null){
        
        clicked_node = selection.focusNode;
        focus_math = CheckNodeInClass(clicked_node,"math", nt_render_div);
    }

    if(focus_math === null){
        if(! selection.isCollapsed){
            if(CheckNodeInClass(selection.anchorNode,"math", nt_render_div)){
                selection.collapse(selection.focusNode, selection.focusOffset);
            }
        }
        DisableEdit(g_editable_math, false);
        return;
    }

    if(g_editable_math !== focus_math){
            //new math is clicked//
        
        const math_class = focus_math.lastChild.className;
        if(["editmath","editmathdisp","editimg"].includes(math_class)){
            DisableEdit(g_editable_math, false);
            if(event.shiftKey){
                const parent = focus_math.parentNode;
                const offset = GetIndex(parent, focus_math);
                document.getSelection().setBaseAndExtent(parent, offset, parent, offset+1);
            }else{
                const math_text = EnableMathEdit(focus_math, 1);
                document.getSelection().collapse(math_text.node, math_text.offset);
            }
        }else{
            let focus_offset = document.getSelection().focusOffset;            
            let anchor_offset = (document.getSelection().anchorNode === document.getSelection().focusNode) ? document.getSelection().anchorOffset : focus_offset;
            
            DisableEdit(g_editable_math, false);
            const math_text = EnableMathEdit(focus_math, 1);
            const margin = GetEditMarginByClassName(math_class);
            focus_offset += margin;
            anchor_offset += margin;
            if(math_class==="editcodedisp"){
                if(math_text.node.data.charAt(3)==='\n'){
                    focus_offset++;
                    anchor_offset++;
                }
            }
            
            if(anchor_offset != focus_offset){
                document.getSelection().setBaseAndExtent(math_text.node, anchor_offset,math_text.node, focus_offset);
            }else{
                document.getSelection().collapse(math_text.node, focus_offset);
            }
        }
    }               
    
}

/*
(1)check the current focus is in the math.
(2)When the math node has the focus, 
(2.1) if the math node is already edit, return null.
(2.2) else if the math node is not edit, 
(2.2.1) disable current editable math node
(2.2.2) enable editable the math node having focus, 
(2.2.3) and then return the focus position.

 When the previewed math is changed into new math node, return value is the math node.
 But, if focus is on math node, the preview math node is keeped current preview math node(g_editable_math),
 return value is null.
*/
function CheckEditPreview(master_node, in_undo_redo = false){
    let focus_math = CheckFocusInClass("math", master_node);
    if(g_editable_math !== focus_math){
        DisableEdit(g_editable_math, in_undo_redo);

        if(focus_math){
            console.log("focus in : " + focus_math);
            
            console.log("num_child: " + focus_math.childNodes.length);
            return EnableMathEdit(focus_math, 1);
        }
    }
    return null;
}

function CheckFocusInClass( target_class_name, master_node){
    let selection = document.getSelection();
    return CheckNodeInClass( selection.focusNode, target_class_name, master_node);
}

function CheckNodeInClass(ref_node, target_class_name, master_node){
    let node = ref_node;
    while(node){
        if(node === master_node){
            break;
        }

        if(node.nodeType===Node.ELEMENT_NODE ){
            if(node.className === target_class_name){
                return node;
            }
        }

        node = node.parentNode;
    }
    return null;
}

function CheckNodeInNode(ref_node, target_node){
    let node = ref_node;
    while(node){
        if(node === target_node){
            return node;
        }
        node = node.parentNode;
    }
    return null;
}

function SetFocusByCoordinate(target_text_node, margin, x, y){
    
    let textNode=null;
    let offset;

    if (document.caretPositionFromPoint) {
        let range = document.caretPositionFromPoint(x, y);
        textNode = range.offsetNode;
        offset = range.offset;    
    } else if (document.caretRangeFromPoint) {
        let range = document.caretRangeFromPoint(x, y);
        textNode = range.startContainer;
        offset = range.startOffset;
    }
    // Only split TEXT_NODEs
    if (textNode ===target_text_node){
        if(textNode.nodeType === Node.TEXT_NODE) {
            if(offset < margin) offset = margin;
            if(offset > textNode.length - margin) offset = textNode.length - margin;
            document.getSelection().collapse(textNode, offset);
            return true;
        }
    }
    return false;
}



function EnableMathEdit(math, offset = 1){
    if(math===null) return null;
    if((math.className!=="math")) return null;
    
    HidePreview(math.firstChild);
    UnsetHide(math.lastChild);
    g_editable_math = math;
    
    const text = math.lastChild.firstChild;
    return {
        node: text,
        offset: ((offset < 0) ? text.length + offset : offset)
    };
    
}

/*
Edit mode of math is disabled. That is, edit txt area is hidden and preview becomes visible.

The return value is {removed:true/false, focus:{node, offset}}. 
If removed is false, the math block is succesfully hidden, and focus becomes null. 
If removed is true, math block is removed because the text of math is empty,
and focus is set to junction point afte removing math node.
However, if in_undo_redo === true, math block mush not be removed.

*/

function DisableEdit(math, in_undo_redo = false){
    if(math===null) return {removed: false, focus:null};
    if(math.className !=="math") return {removed: false, focus:null};
    
    let next_focus_node = null; 
    let next_focus_offset = 0;

    let edit_node = math.lastChild;
    const margin = GetEditMargin(math);

    //let mathtext = edit_node.textContent.substring(edit_node.textContent.charAt(0) === "$" ? 1 : 0, edit_node.textContent.length - (edit_node.textContent.charAt(edit_node.textContent.length - 1) === "$" ? 1 : 0));
    let text_node = edit_node.firstChild;
    let mathtext = text_node.data.slice( margin  , text_node.length - margin);

    let is_removed = (mathtext.length === 0);
    let pos_split_a_img = 0;
    if((edit_node.className==="edita") || (edit_node.className==="editimg")){
        pos_split_a_img = mathtext.indexOf("](");
        if(pos_split_a_img < 0){
            is_removed = true;
        }
    }

    if(is_removed){
        if( in_undo_redo ){  // if this routine calld by Undo/Redo routine, the math element is not removed.

            g_editable_math = null;
            return {removed: false, focus:null};

        }else{
            //remove math//            
            undo_man.Begin(text_node, margin);
            const parent = math.parentNode;
            //const offset = GetIndex(parent, math);
            const math_next = math.nextSibling;
            RemoveNode(math);
            const focus = SafeJunctionPoint(parent, math_next);

            /*
            if(parent.nodeName==="P"){
                if(IsSpanMathImg(parent.firstChild.nextSibling)){
                    const figure = ConvertPtoFigure(parent);
                    
                    if(next_focus_node === null){                            
                        const focus = EnableMathEdit(figure.firstChild, 2);
                        next_focus_node = focus.node;
                        next_focus_offset = focus.offset;
                    }
                }
            }else if (parent.nodeName==="FIGURE"){
                if(!IsSpanMathImg(parent.firstChild.nextSibling)){
                    ConvertFiguretoP(parent);
                }
            }
            */
            
            
            undo_man.End(focus.node, focus.offset);
            
            g_editable_math = null;
            return {removed: true, focus:focus}; // 

        }
    }

    switch(edit_node.className){
        case "editmath":
            {
                MathRendering(math, mathtext, -1);        
                ShowPreview(math.firstChild);
            }
            break;
        case "editmathdisp":
            {
                MathRendering(math, mathtext, -1);
                ShowPreviewDisplay(math.firstChild);
                
                /*
                Node: getBoundingClientRect() should not be used
                    because this return values are changed by zoom.
                    On the other hand, clentWidth and clientHeight are indepenent of zoom
                */
                math.firstChild.style.width = String(math.firstChild.clientWidth) + "px";
                math.firstChild.style.height = String(math.firstChild.clientHeight) + "px";
            }
            break;
        case "editcode":
            {
                math.firstChild.firstChild.data = mathtext;
                ShowPreview(math.firstChild);
            }   
            break;    
        case "editcodedisp":
            {
                if(mathtext.charAt(0)==='\n'){
                    math.firstChild.firstChild.data = mathtext.slice(1,mathtext.length-1);
                }else{
                    math.firstChild.firstChild.data = mathtext;
                }
                ShowPreviewDisplay(math.firstChild);
            }
            break;
        case "editem1":
        case "editem2":
        case "editem3":
            {
                let target = math.firstChild.firstChild;
                if (target.nodeType === Node.TEXT_NODE){
                    target.data = mathtext;
                }else{
                    target.firstChild.data = mathtext;
                }
                ShowPreview(math.firstChild);
            }
            break;
        case "edita":
            {
                let target = math.firstChild;
                target.href = mathtext.slice(pos_split_a_img + 2, mathtext.length+1);
                target.firstChild.data = mathtext.slice(0,pos_split_a_img);
                ShowPreview(target);
            }
            break;      
        case "editimg":
            {
                const target = math.firstChild;
                target.src = nt_file_dir + mathtext.slice(pos_split_a_img + 2, mathtext.length+1);
                target.alt = mathtext.slice(0,pos_split_a_img);
                ShowPreview(target);
            }
            break;               
        case "editcite":
            {
                const target = math.firstChild;
                target.href = "#" + mathtext;
                target.firstChild.data =  mathtext;
                ShowPreview(target);
            }
            break;            
        case "editref":
            {
                const target = math.firstChild;                    
                target.firstChild.data = mathtext;
                ShowPreview(target);
            }
            break;            
        default:
            {
                alert("ERROR: invalid edit class in math like node");
            }
            break;
    }
                
    SetHide(math.lastChild);
    g_editable_math = null;

    /*
    if(next_focus_node){
        document.getSelection().collapse(next_focus_node, next_focus_offset);
    }
    */
    return {removed: false, focus:null};

    
}

function MathRendering(math, mathtext, number){
    
    let annotation = math.firstChild.getElementsByTagName("annotation");
    if(annotation){
        if (annotation.textContent === mathtext) {   
            return 0;//no redraw//
        }
    }

    let edit_node = math.lastChild;

    let delta = 0;

    //re-rendering
    if(edit_node.className==="editmath"){
        
        //change ref{...} to equation number//
        let ref_mathtext = ReferLabelEqnumber(mathtext);

        math.firstChild.remove();
        //math.insertAdjacentHTML('afterbegin', katex.renderToString(ref_mathtext, {output: "html", displayMode: false, throwOnError: false })); 
        const fragment = new DocumentFragment();
        katex.render(ref_mathtext,fragment, {output: "html", displayMode: false, throwOnError: false }); 
        math.insertBefore(fragment, math.firstChild);
        math.firstChild.contentEditable=false;
    }else if(edit_node.className==="editmathdisp"){

        if(number===0){
            math.firstChild.remove();
            const re_mathtext = ReplaceAll(mathtext, "{align}", "{aligned}");
            //math.insertAdjacentHTML('afterbegin', katex.renderToString(re_mathtext, {output: "html", displayMode: true, throwOnError: false }));
            const fragment = new DocumentFragment();
            katex.render(re_mathtext,fragment, {output: "html", displayMode: true, throwOnError: false }); 
            math.insertBefore(fragment, math.firstChild);
            
        }else{
            if(number < 0){
                number = parseInt(math.dataset.eqnumberBegin, 10);
            }
            math.firstChild.remove();            
            delta = katexAutoNumber(mathtext, math, number);
            math.dataset.eqnumberBegin = number;
            math.dataset.eqnumberEnd = number + delta;
            
        }
                        
        math.firstChild.contentEditable=false;
        
    }else{
        alert("invalid math editting");
    }

    //math.firstChild.contentEditable="false";// if this becomes valid, the math preview sannot be selected char by char, but except for firefox //

    return delta;
}

        
        /*
        // this is necessary for chrome focus.
        */
        function HidePreview(node){
            node.style.display="none";
        }
        function ShowPreview(node){
            node.style.display="inline";
        }
        function ShowPreviewDisplay(node){
            node.style.display="block";
        }
    
       
       //this is NG because the cursor after math is not invalid
       /*
            function SetHide2(node){
                node.hidden =true;
            }
            function UnsetHide2(node){
                node.hidden=false;
            }
        */
       
function SetHide(node) {
    
    //node.style.display="none";
    node.style.cssText = "border: 0; clip: rect(0 0 0 0); height: 1px; margin: -1px; overflow: hidden; padding: 0; position: absolute; white-space: nowrap; width: 1px;";
}
function UnsetHide(node) {
    
    //node.style.display="inline";
    node.style.cssText = "clip: auto; height: auto; margin: 0; overflow: visible; position: static; width: auto;";
}



function GetEditMargin(math){    
    const class_name = math.className;
    return GetEditMarginByClassName((class_name === "math") ? math.lastChild.className : class_name);
}

function GetEditMarginByClassName(class_name){
    switch(class_name){
        case "editmath": return 1;
        case "editmathdisp": return 2;
        case "editcode": return 1;
        case "editcodedisp": return 3;
        case "editem1": return 1;
        case "editem2": return 2;
        case "editem3": return 3;
        case "edita": return 1;
        case "editimg": return 2;
        case "editcite": return 2;
        case "editref": return 2;
        
        default: return 0;
    }    
}

function SetEqNumber(math, number){
    let delta = parseInt(math.dataset.eqnumberEnd ,10) - parseInt(math.dataset.eqnumberBegin ,10)
    math.dataset.eqnumberBegin = number;
    math.dataset.eqnumberEnd = number + delta;

}

function IsTextNodeInMath(node){
    if(node.parentNode===null)return false;
    if(node.parentNode.parentNode===null)return false;
    return (node.parentNode.parentNode.className==="math");
}


function QuickRedrawMath(render_div){
    /*
    Rendering(DOM generation) with Katex,
    Caret movement becomes slow when data is large.
    This problem occurs especually in Chrome.
    This is caused by the large size of DOM.
    Probably, this is not problem in rendering, 
    this is problem of the calculation of caret position coordinate in big DOM.
    To solve this problem, 
    To avoid this problem, 
    Katex span elements out of window should be set to be not displayed.
    That is, style "display: none" is set.
    And, to keep layout (position) of the other elements,
    wrapper span tag has style "width: X.XXXpx; height: Y.YYYpx", 
    where the width and height is obtained from clientWidth and clientHeight.
    
    Node: getBoundingClientRect() should not be used for get width and height
        because this return values are changed by zoom, 
        while clentWidth and clientHeight are indepenent of zoom
        Therefore, the width and height to set style of math is obtained from clientWidth and clientHeight.
        And, the check of region to inside/out of window is performed by using getBoundingClientRect() .               
    */

    let matches = render_div.querySelectorAll('span.editmathdisp');
    const whole_height = document.documentElement.clientHeight;
    console.log("scroll/resize",matches.length);

    for (let i=0; i<matches.length; i++) {
        const editmath = matches[i];
        const math = editmath.parentNode;        
        const katexdisp = math.firstChild;
        const katex = katexdisp.firstChild;
        
        const rect = katexdisp.getBoundingClientRect();
        
        if(katex.style.display == "none"){
            if((rect.bottom > 0.0) && (rect.top < whole_height)){
                if(math !==g_editable_math)
                {
                    katex.style.display = null;                    
                }
            }
        }else{
            if((rect.bottom < 0.0) || (rect.top > whole_height)){
            
                if(katexdisp.style.length <= 1){
                    if(rect.height>0.0){
                        katexdisp.style.width =String(katexdisp.clientWidth) + "px";
                        katexdisp.style.height=String(katexdisp.clientHeight) + "px";
                    }
                }
                katex.style.display = "none";
            }            
        }
        
        
    }
}


function FullRedrawMath(render_div){
    /*
        Redraw all math.
        Purpose is to make visible all math before print, 
        because displayed math is invisible for performance of movement of caret by using QuickRedrawMath().
    */
    
    let matches = render_div.querySelectorAll('span.editmathdisp');
    const whole_height = document.documentElement.clientHeight;
    console.log("all displayed math are visible",matches.length);

    for (let i=0; i<matches.length; i++) {
        const editmath = matches[i];
        const math = editmath.parentNode;        
        const katexdisp = math.firstChild;
        const katex = katexdisp.firstChild;
        
        katex.style.display = null;
        
    }
}
