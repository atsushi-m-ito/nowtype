"use strict";

const IME_TYPE = {
    GENERAL:         0,
    WIN_FIREFOX:     0,  //FireFox on Windows10//
    WIN_EDGE_LEGACY: 1,  //Edge(Legacy) on Windows10//
    WIN_CHROME:      2,  //Chrome on Windows10//
    WIN_EDG_CHR:     4,  //Edge(Chromium) on Windows10//
    WIN_ELECTRON:    5,  //Electron on Windows10//
    MAC_FIREFOX:   100,  //FireFox on Mac OS//
    MAC_CHROME:    102,  //Chrome on Mac OS//
    MAC_SAFARI:    103,  //Safari on Mac OS//
    MAC_ELECTRON:  105,   //Electron on Mac OS//
    LNX_FIREFOX:    200,  //FireFox on Linux// 
    LNX_CHROME:     202,  //Chrome on Linux//
    LNX_ELECTRON:   205,  //Electron on Linux//
};


let nt_render_div = null;//used for nt dispatch//
let nt_is_MacOS = false;

function NT_Initialize(target_div_id, ime_type) {
//import * as nt from "./nowtype.js" 

    console.log("IME_type = ", ime_type);

    const render_div = document.getElementById(target_div_id);
    nt_render_div = render_div;

    render_div.contentEditable = "true";
    
    
    render_div.addEventListener("keydown", OnKeydownForShortcut, false);
  
    switch(ime_type){
    case IME_TYPE.WIN_EDGE_LEGACY://for IME on WIN_EDGE_LEGACY//
        MO_InitComposition(render_div);
        render_div.addEventListener("compositionstart", MO_OnCompositionstart, false);
        render_div.addEventListener("compositionupdate", MO_OnCompositionupdate, false);
        render_div.addEventListener("compositionend", MO_OnCompositionend, false);
        render_div.addEventListener("keydown", MO_OnKeydownForIME, false);
        render_div.addEventListener("contextmenu", MO_OnContextmenuForIME, false);//cancel during IME//
        /*
        render_div.addEventListener("compositionstart", EDGE_OnCompositionstart, false);
        render_div.addEventListener("compositionupdate", EDGE_OnCompositionupdate, false);
        render_div.addEventListener("compositionend", EDGE_OnCompositionend, false);
        render_div.addEventListener("keydown", EDGE_OnKeydownForIME, false);
        render_div.addEventListener("contextmenu", EDGE_OnContextmenuForIME, false);//cancel during IME//
        */
        //key event without IME//
        render_div.addEventListener("keydown", OnKeydownForNavigation, false);
        render_div.addEventListener("keydown", OnKeydownForAsciiChar, false);
        render_div.addEventListener("keyup", OnKeyup, false);        
        break;
    case IME_TYPE.WIN_CHROME://for IME on Chrome//
    case IME_TYPE.LNX_CHROME://for IME on Chrome//
    case IME_TYPE.WIN_EDG_CHR://for IME on Chrome//
    case IME_TYPE.WIN_ELECTRON:
    case IME_TYPE.LNX_ELECTRON:
        MO_InitComposition(render_div);
        render_div.addEventListener("compositionstart", MO_OnCompositionstart, false);
        render_div.addEventListener("compositionupdate", MO_OnCompositionupdate, false);
        render_div.addEventListener("compositionend", MO_OnCompositionendForChrome, false);
        render_div.addEventListener("keydown", MO_OnKeydownForIME, false);
        render_div.addEventListener("contextmenu", MO_OnContextmenuForIME, false);//cancel during IME//
        
        /*
        render_div.addEventListener("compositionstart", CHRM_OnCompositionstart, false);
        render_div.addEventListener("compositionupdate", CHRM_OnCompositionupdate, false);
        render_div.addEventListener("compositionend", CHRM_OnCompositionend, false);
        render_div.addEventListener("keydown", CHRM_OnKeydownForIME, false);
        */
        //key event without IME//
        render_div.addEventListener("keydown", OnKeydownForNavigation, false);
        render_div.addEventListener("keydown", OnKeydownForAsciiChar, false);
        render_div.addEventListener("keyup", OnKeyup, false);
        break;
    case IME_TYPE.MAC_CHROME://for IME on Chrome(Mac)//
    case IME_TYPE.MAC_ELECTRON:
        MO_InitComposition(render_div);
        render_div.addEventListener("compositionstart", MO_OnCompositionstart, false);
        render_div.addEventListener("compositionupdate", MO_OnCompositionupdate, false);
        render_div.addEventListener("compositionend", MO_OnCompositionendForChrome, false);
        render_div.addEventListener("keydown", MO_OnKeydownForIME, false);
        render_div.addEventListener("contextmenu", MO_OnContextmenuForIME, false);//cancel during IME//
/*        
        render_div.addEventListener("compositionstart", CHRM_OnCompositionstart, false);
        render_div.addEventListener("compositionupdate", CHRM_OnCompositionupdate, false);
        render_div.addEventListener("compositionend", CHRM_OnCompositionend, false);
        render_div.addEventListener("keydown", CHRM_OnKeydownForIME, false);
*/
        //key event without IME//
        render_div.addEventListener("keydown", OnKeydownForNavigation, false);
        render_div.addEventListener("beforeinput", OnBeforeinputForAsciiChar, false);
        render_div.addEventListener("keyup", OnKeyup, false);
        nt_is_MacOS = true;
        break;
    case IME_TYPE.MAC_SAFARI://for IME on Safari(Mac)//
        MO_InitComposition(render_div);
        render_div.addEventListener("compositionstart", MO_OnCompositionstart, false);
        render_div.addEventListener("compositionupdate", MO_OnCompositionupdate, false);
        render_div.addEventListener("compositionend", MO_OnCompositionend, false);
        render_div.addEventListener("keydown", MO_OnKeydownForIME, false);
        render_div.addEventListener("contextmenu", MO_OnContextmenuForIME, false);//cancel during IME//
/*    
        render_div.addEventListener("compositionstart", FF_OnCompositionstart, false);
        render_div.addEventListener("compositionupdate", FF_OnCompositionupdate, false);
        render_div.addEventListener("compositionend", FF_OnCompositionend, false);
    */
        render_div.addEventListener("input", SAFARI_OnInputMarkingEnter, false);
        
        
        //key event without IME//
        render_div.addEventListener("keydown", SAFARI_OnKeydownForNavigation, false);
        render_div.addEventListener("beforeinput", OnBeforeinputForAsciiChar, false);
        render_div.addEventListener("keyup", OnKeyup, false);
        nt_is_MacOS = true;
        break;
    default://for IME on Fire Fox//        
        MO_InitComposition(render_div);
        render_div.addEventListener("compositionstart", MO_OnCompositionstart, false);
        render_div.addEventListener("compositionupdate", MO_OnCompositionupdate, false);
        render_div.addEventListener("compositionend", MO_OnCompositionend, false);
        render_div.addEventListener("keydown", MO_OnKeydownForIME, false);
        render_div.addEventListener("contextmenu", MO_OnContextmenuForIME, false);//cancel during IME//
        
        /*
        render_div.addEventListener("compositionstart", FF_OnCompositionstart, false);
        render_div.addEventListener("compositionupdate", FF_OnCompositionupdate, false);
        render_div.addEventListener("compositionend", FF_OnCompositionend, false);
        */
        //key event without IME//
        render_div.addEventListener("keydown", OnKeydownForNavigation, false);
        render_div.addEventListener("keydown", OnKeydownForAsciiChar, false);
        render_div.addEventListener("keyup", OnKeyup, false);
        if(ime_type===IME_TYPE.MAC_FIREFOX){
            nt_is_MacOS = true;
        }
        break;        
    }    
    
    
    render_div.addEventListener("cut", OnCut, false);
    render_div.addEventListener("copy", OnCopy, false);
    render_div.addEventListener("paste", OnPaste, false);
    document.addEventListener("click", OnClick, false);   //document is necessary to handle mouseup at the out of windows//
    render_div.addEventListener("mousedown", OnMouseDownTable, false);   //document is necessary to handle mouseup at the out of windows//
    render_div.addEventListener("mousemove", OnMouseMoveTable, false);   //document is necessary to handle mouseup at the out of windows//
    render_div.parentNode.parentNode.addEventListener("scroll", OnScroll, {passive: true});
    window.addEventListener("resize", OnScroll, {passive: true});
    //undo/redo is not the event supported by browser//
    
    //undo_man 
    undo_man = new UndoManager();
    undo_man.SetChangeEventDispatcher(new ChangeEventDispatcher(render_div));
    
}


/*
Emulation of input event for Edge
*/
let EDGE_input_event_args = {data: null, 
    isComposing: false, 
    inputType: "insertText",
    dataTransfer: null};
function EDGE_KeepForInputEvent(event){
    console.log("EDGE_KeepForInputEvent");
    if(event.key){
        EDGE_input_event_args.data = event.key;
        EDGE_input_event_args.isComposing = EDGE_IME_in_action;        
        EDGE_input_event_args.inputType= "insertText";
        EDGE_input_event_args.dataTransfer= null;
    }
}

let SAFARI_is_just_after_compositionend = false;
function SAFARI_OnInputMarkingEnter(event){
    //monitor the Enter/Backspace/Delete keydown just after IME end//
    if((event.inputType==="insertFromComposition")||(event.inputType==="deleteCompositionText")){
        SAFARI_is_just_after_compositionend = true;
        return false;
    }
}


function SAFARI_OnKeydownForNavigation(event){
    //cancel the Enter/Backspace/Delete keydown just after IME end//
    if(SAFARI_is_just_after_compositionend){
        SAFARI_is_just_after_compositionend = false;
        
        if((event.key==="Enter")||(event.key==="Delete")||(event.key==="Backspace")){
            event.preventDefault();
            console.log("cancel the", event.key, "just after IME end");
            return;
        }
    }
    
    OnKeydownForNavigation(event);
    return;
}


function NT_ResetChangeFlag(){
    undo_man.GetChangeEventDispatcher().Reset();
}

/* For redrawing math when scroll.
   note that, this event brings when printing by printer devices. 
   Therefore, math quick redrawing and hideing should be stoped during printing.
*/
let nt_scroll_ticking = false;
function OnScroll(event){
    if(!nt_scroll_ticking){
        window.requestAnimationFrame(()=>{
            if(! nt_now_printing ){ 
                QuickRedrawMath(nt_render_div);
            }
            nt_scroll_ticking = false;
        });
        nt_scroll_ticking = true;
    }
}

let nt_now_printing = false; /*flag of printing or not, this is used for math redraw*/
let nt_focus_print = null;
function NT_BeginPrint(){
    
    if(g_editable_math){
        DisableEdit(g_editable_math);
    }
    const selection = document.getSelection();
    nt_focus_print = {anchorNode:selection.anchorNode,anchorOffset:selection.anchorOffset,
        focusNode:selection.focusNode,focusOffset:selection.focusOffset}
    FullRedrawMath(nt_render_div);
    nt_render_div.contentEditable="false";
    nt_now_printing = true;
}

function NT_EndPrint(){
    nt_now_printing = false;
    nt_render_div.contentEditable="true";
    QuickRedrawMath(nt_render_div);
    
    document.getSelection().setBaseAndExtent(nt_focus_print.anchorNode,nt_focus_print.anchorOffset,
        nt_focus_print.focusNode, nt_focus_print.focusOffset);
    
}