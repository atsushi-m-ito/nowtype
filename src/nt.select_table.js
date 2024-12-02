"use strict";

let nt_selected_cell = null;
let nt_anchor_cell = null;
const NT_SELECT_CELL_MODE = -256;

function IsTableSelectionMode(){
    return !(nt_selected_cell===null);
}

function SwitchInputArrowLeftTable(node, offset) {
    if(!nt_selected_cell.previousSibling) return true;

    if(nt_selected_cell.previousSibling.classList.contains("selectcell")){
        //release selected cell//
        ReleaseTableSelectVertical(nt_selected_cell);
        
    }else{
        //expand select cell//
        const index = GetIndex(nt_selected_cell.parentNode,nt_selected_cell);
        const table = nt_selected_cell.parentNode.parentNode;          
        table.childNodes.forEach((tr)=>{
            const td = tr.childNodes.item(index);
            if(td.classList.contains("selectcell")){
                td.previousSibling.classList.add("selectcell");
            }
        });
    }
    nt_selected_cell.classList.remove("maincell");
    nt_selected_cell = nt_selected_cell.previousSibling;
    nt_selected_cell.classList.add("maincell");
}


function SwitchInputArrowRightTable(node, offset) {
    if(!nt_selected_cell.nextSibling) return true;

    if(nt_selected_cell.nextSibling.classList.contains("selectcell")){
        //release selected cell//
        ReleaseTableSelectVertical(nt_selected_cell);
        
    }else{
        //expand select cell//
        const index = GetIndex(nt_selected_cell.parentNode,nt_selected_cell);
        const table = nt_selected_cell.parentNode.parentNode;          
        table.childNodes.forEach((tr)=>{
            const td = tr.childNodes.item(index);
            if(td.classList.contains("selectcell")){
                td.nextSibling.classList.add("selectcell");
            }
        });
    }
    nt_selected_cell.classList.remove("maincell");
    nt_selected_cell = nt_selected_cell.nextSibling;
    nt_selected_cell.classList.add("maincell");
}

function SwitchInputArrowUpTable(node, offset) {
    const tr = nt_selected_cell.parentNode;
    if(!tr) return true;
    if(!tr.previousSibling) return true;
    
    const index = GetIndex(tr, nt_selected_cell);
    const next_cell = tr.previousSibling.childNodes.item(index);
    if(next_cell.classList.contains("selectcell")){
        //release selected cell//
        ReleaseTableSelectHorizontal(nt_selected_cell);
        
    }else{
        //expand select cell//
        let tdp = tr.previousSibling.firstChild;
        for(let td = tr.firstChild; td; td = td.nextSibling){
            if(td.classList.contains("selectcell")){
                tdp.classList.add("selectcell");
            }
            tdp = tdp.nextSibling;
        }        
    }

    nt_selected_cell.classList.remove("maincell");
    nt_selected_cell = next_cell;
    nt_selected_cell.classList.add("maincell");            
    
}

function SwitchInputArrowDownTable(node, offset) {
    const tr = nt_selected_cell.parentNode;
    if(!tr) return true;
    if(!tr.nextSibling) return true;
    
    const index = GetIndex(tr, nt_selected_cell);
    const next_cell = tr.nextSibling.childNodes.item(index);
    if(next_cell.classList.contains("selectcell")){
        //release selected cell//
        ReleaseTableSelectHorizontal(nt_selected_cell);
        
    }else{
        //expand select cell//
        let tdp = tr.nextSibling.firstChild;
        for(let td = tr.firstChild; td; td = td.nextSibling){
            if(td.classList.contains("selectcell")){
                tdp.classList.add("selectcell");
            }
            tdp = tdp.nextSibling;
        }        
    }
    
    nt_selected_cell.classList.remove("maincell");
    nt_selected_cell = next_cell;
    nt_selected_cell.classList.add("maincell");            
    
}

/*
This function should be called to finish table selection mode.
*/
function ReleaseTableSelectAll(){
    if(!nt_selected_cell ) return;
    const parent = nt_selected_cell.parentNode;
    nt_selected_cell.classList.remove("maincell");
    nt_selected_cell = null;
    
    if(!parent) return;
    
    const table = parent.parentNode;
    if(!table) return;

    table.childNodes.forEach((tr)=>{
        tr.childNodes.forEach((td)=>{
            td.classList.remove("selectcell");
        });
    });    
    
}

/*
Release selected cells which col is same as the argument cell
*/
function ReleaseTableSelectVertical(cell){
    if(!cell ) return;
    if(!cell.parentNode) return;
    const table = cell.parentNode.parentNode;
    if(!table) return;

    const index = GetIndex(cell.parentNode,cell);
    
    table.childNodes.forEach((tr)=>{
        const td = tr.childNodes.item(index);
        td.classList.remove("selectcell");
    });    
}

/*
Release selected cells which row is same as the argument cell
*/
function ReleaseTableSelectHorizontal(cell){
    if(!cell ) return;
    if(!cell.parentNode) return;
    const table = cell.parentNode.parentNode;
    if(!table) return;

    const tr = cell.parentNode;
    tr.childNodes.forEach((td)=>{
        td.classList.remove("selectcell");
    });
}


function CheckNodeInTD(ref_node,  master_node){

    let node = ref_node;
    while(node){
        if(node === master_node){
            return null;
        }

        if((node.nodeName === "TD") || (node.nodeName === "TH")){
            return node;
        }

        node = node.parentNode;
    }
    return null;
}



function OnMouseDownTable(event){
    if(!event.shiftKey){
        if(nt_selected_cell){
            //clear select cells//
            ReleaseTableSelectAll();
            
        }
        return true;
    }

    return CommonMouseDownAndMoveTable(event);
}

function OnMouseMoveTable(event){
    if((event.buttons & 1) == 0) return true;
    
    return CommonMouseDownAndMoveTable(event);

}

// the following routine is almostly common between MouseDown and MouseMove //
function CommonMouseDownAndMoveTable(event){
    const node  = document.elementFromPoint(event.clientX, event.clientY);
    if(!node) {
        console.log("invalid node");
        return true;
    }
    
    const selection = document.getSelection();

    if(nt_selected_cell){ //already select cell mode //
                
        const td = CheckNodeInTD(node, nt_render_div);
        if(td){
            if(IsSameTable(td,nt_selected_cell)){
                const anchor_td = nt_anchor_cell;
                ReleaseTableSelectAll();
                
                if(SetSelectTable(anchor_td, td)){
                    event.preventDefault();
                    return false;
                }
            }
        }

        //no change the selecte cells//
        if(selection.rangeCount > 0){
            const focus = FocusOffsetZero(nt_selected_cell);
            selection.collapse(focus.node, focus.offset);
        }
        event.preventDefault();
        return false;        
        
    } else {  //simple text edit mode //

        const td = CheckNodeInTD(node, nt_render_div);
        const anchor = CheckNodeInTD(selection.anchorNode, nt_render_div);
        if(anchor){
            if(td){ //from table (anchor) to table (focus) //
            
                if(anchor === td){
                    return true; //to do default text selection//
                }
                if(IsSameTable(anchor, td)){
                    if(SetSelectTable(anchor, td)){
                        event.preventDefault();
                        return false;
                    }
                }
                //here, different table//
                
                const table_focus = td.parentNode.parentNode;
                const table_anchor = anchor.parentNode.parentNode;
                const master = table_focus.parentNode;
                const index_focus = GetIndex(master, table_focus);
                const index_anchor = GetIndex(master, table_anchor);
                if(index_anchor < index_focus){
                    selection.setBaseAndExtent(master, index_anchor, master, index_focus+1);
                }else{                    
                    selection.setBaseAndExtent(master, index_focus, master, index_anchor+1);
                }
                event.preventDefault();
                return false;
                
            }else{ // from table (anchor) to text(focus) //

                const table = anchor.parentNode.parentNode;
                
                //finding top node of anchor//
                const master = table.parentNode;
                const top_focus = FindTopNode(node, master);
                if(!top_focus){
                    event.preventDefault();
                    return false;
                }
                const index_table = GetIndex(master, table);
                const index_focus = GetIndex(master, top_focus);
                if(index_table < index_focus){
                    selection.setBaseAndExtent(master, index_table, node, 0);
                }else{                    
                    selection.setBaseAndExtent(master, index_table + 1, node, 0);
                }
                //default selection of focus after this routine is neccessary to set correct forcus offset//
                return true;

            }
        }
        /*else{ //anchor is not in table//////////////////////
            if(!selection.anchorNode){
                event.preventDefault();
                return false;
            }
            if(td){ // from text (anchor) to table (focus) //
                    
                const table = td.parentNode.parentNode;
                
                //finding top node of anchor//
                const master = table.parentNode;
                const top_anchor = FindTopNode(selection.anchorNode, master);
                if(!top_anchor){
                    event.preventDefault();
                    return false;
                }
                
                //here, top_anchor is just child of master//
                const index_table = GetIndex(master, table);
                const index_anchor = GetIndex(master, top_anchor);
                if(index_table < index_anchor){
                    //selection.extend(master, index_table);
                    selection.setBaseAndExtent(selection.anchorNode, selection.anchorOffset, master, index_table + 1);
                }else{                    
                //    selection.extend(master, index_table+1);
                    selection.setBaseAndExtent(selection.anchorNode, selection.anchorOffset, master, index_table + 1);
                }
                console.log("Move on table");
                event.preventDefault();
                //event.stopImmediatePropagation();
                return false;
            
            }else{ // from text (anchor) to text (focus) //
                console.log("to do default");                
                return false; //to do default text selection//
            }
        }*/
    }    

    return true; //continue to OnClick event listener to set focus of selection//
}

/*
should be called when starting select cell mode
*/
function SetSelectTable(anchor_td, focus_td){
    
    if(nt_selected_cell){
        nt_selected_cell.classList.remove("maincell");
    }

    if(anchor_td){
        if(focus_td){
            nt_selected_cell = focus_td;
            nt_anchor_cell = anchor_td;
            const range = RangeSelectedIndexes();
            SelectCells(range);
            
            nt_selected_cell.classList.add("maincell");
                
            //const focus = FocusOffsetZero(nt_selected_cell);
            //document.getSelection().collapse(focus.node, focus.offset);
            //document.getSelection().removeAllRanges();
            if(document.getSelection().rangeCount>0){
                document.getSelection().collapseToStart();
            }
            return true;
        }
    }
    return false;
    
}


function IsSameTable(anchor_td, focus_td){
    const anchor_tr = anchor_td.parentNode;
    const select_tr = focus_td.parentNode;
    const table = select_tr.parentNode;
    if(table !== anchor_tr.parentNode){                    
        return false;
    }
    return true;
}


function SelectCells(range){
    
    const selection = document.getSelection();

    const table = nt_selected_cell.parentNode.parentNode;
    
    let tr = table.childNodes.item(range.tr.begin);
    for(let k = range.tr.begin; k < range.tr.end; ++k){        
        let td = tr.childNodes.item(range.td.begin);
        for(let i = range.td.begin; i < range.td.end; ++i){
            td.classList.add("selectcell");
            td = td.nextSibling;
        }
        tr = tr.nextSibling;
    }
    
    return true;
}

function FindTopNode(node, master){
    while(node){
        if(node.parentNode === master) return node;
        node = node.parentNode;
    }
    return node;
}


/*
If edge(start/end) node is in table, the selection range is expande to the point before/after table.
The return value is true if the selection range is not changed then, 
while the return value is false if the selection range is expanded.

This function is necessary for selection range is invalid
in paticullar focus and anchor is in differennt table.
For example the key inputs of ArrowUp and ArrowDown with Shift can bring 
the invalid selection state.

*/
function CorrectSelectionEdgeTable(){ //called before CutSelection//
    const selection = document.getSelection();
    if(selection.isCollapsed) return true;

    const range = selection.getRangeAt(0);
    const start_node = range.startContainer;
    const end_node = range.endContainer;
    let anchor_node = selection.anchorNode;
    let anchor_offset = selection.anchorOffset;
    let focus_node = selection.focusNode;
    let focus_offset = selection.focusOffset;

    const anchor_td = CheckNodeInTD(anchor_node, nt_render_div);        
    const focus_td = CheckNodeInTD(focus_node, nt_render_div);
    if((!!focus_td) && (focus_td === anchor_td)) return true; // selection in a single cell//

    
    const anchor_table = (anchor_td) ? anchor_td.parentNode.parentNode : 
            (anchor_node.nodeName == "TABLE") ? anchor_node :
            (anchor_node.nodeName == "TR") ? anchor_node.parentNode : null;
    if(anchor_table){
        const index = GetIndex(anchor_table.parentNode, anchor_table);
        if(anchor_node === start_node){
            anchor_offset = index;
        }else{
            anchor_offset = index+1;
        }
        anchor_node = anchor_table.parentNode;    
    }

    const focus_table = (focus_td) ? focus_td.parentNode.parentNode : 
            (focus_node.nodeName == "TABLE") ? focus_node :
            (focus_node.nodeName == "TR") ? focus_node.parentNode : null;
    if(focus_table){
        const index = GetIndex(focus_table.parentNode, focus_table);
        if(focus_node === start_node){
            focus_offset = index;
        }else{
            focus_offset = index+1;
        }
        focus_node = focus_table.parentNode;  
    }

    if((anchor_table) || (focus_table)){
        selection.setBaseAndExtent(anchor_node, anchor_offset, focus_node, focus_offset);
        return false;
    }
    return true;
}



/*
This callback function is called when nt_selected_cell is not null

*/
function OnKeydownForNavigationTable(event) {
    
    console.log("keydown(Navi:Table):", event.key);
    
    
    
    //without special keys//
    const selection = document.getSelection();
    const [node,offset] = [nt_selected_cell,0];
    

    switch (event.key) {        
        case "ArrowUp":
            {       
                event.preventDefault();
                if(event.getModifierState("Shift")){
                    SwitchInputArrowUpTable(node, offset);
                }else{
                    const focus_node = nt_selected_cell.firstChild;
                    ReleaseTableSelectAll();
                    if(focus_node.nodeType == Node.TEXT_NODE){
                        selection.collapse(focus_node, 0);
                    }else{
                        selection.collapse(focus_node.parentNode, 0);
                    }
                    
                }
                
            }
            break;       
        case "ArrowDown":
            {
                event.preventDefault();
                
                if(event.getModifierState("Shift")){
                    SwitchInputArrowDownTable(node, offset);
                }else{
                    const focus_node = nt_selected_cell.lastChild;
                    ReleaseTableSelectAll();
                    if(focus_node.nodeType == Node.TEXT_NODE){
                        selection.collapse(focus_node, focus_node.length);
                    }else{
                        selection.collapse(focus_node.parentNode, focus_node.parentNode.childNodes.length);
                    }
                    
                }
                
            }
            break;
        case "ArrowLeft":
            {            
                event.preventDefault();
                if(event.getModifierState("Shift")){
                    SwitchInputArrowLeftTable(node, offset);
                }else{
                    const focus_node = nt_selected_cell.firstChild;
                    ReleaseTableSelectAll();
                    if(focus_node.nodeType == Node.TEXT_NODE){
                        selection.collapse(focus_node, 0);
                    }else{
                        selection.collapse(focus_node.parentNode, 0);
                    }
                    
                }
                
            }
            break;
        case "ArrowRight":
            {
                event.preventDefault();
                if(event.getModifierState("Shift")){
                    SwitchInputArrowRightTable(node, offset);
                }else{
                    const focus_node = nt_selected_cell.lastChild;
                    ReleaseTableSelectAll();
                    if(focus_node.nodeType == Node.TEXT_NODE){
                        selection.collapse(focus_node, focus_node.length);
                    }else{
                        selection.collapse(focus_node.parentNode, focus_node.parentNode.childNodes.length);
                    }
                 
                }
                
            }
            break;
        case "Enter":
            {
                //nothing to do//                
            }
            break;
        case "Delete":
        case "Backspace":
            {
                event.preventDefault();

                if(IsHighlightMode()){
                    NT_HighlightClear();
                }

                //delete all in selected cell//
                const range = RangeSelectedIndexes();
                undo_man.Begin(nt_selected_cell, NT_SELECT_CELL_MODE, nt_anchor_cell, NT_SELECT_CELL_MODE);
                DeleteSelectedCells(range);
                undo_man.End(nt_selected_cell, 0);
                selection.collapse(nt_selected_cell, 0);
                ReleaseTableSelectAll();
                
                
            }
            break;
        case "Tab": 
            {
                event.preventDefault();
                //nothing to do//
            }
            break;
        }

    return;
}

function RangeSelectedIndexes(){
    if(!nt_selected_cell ) return null;
    const focus_tr = nt_selected_cell.parentNode;
    const anchor_tr = nt_anchor_cell.parentNode;
    const table = focus_tr.parentNode;
    if(!table) return null;
    
    let end_td_index = GetIndex(focus_tr, nt_selected_cell);
    let begin_td_index = GetIndex(anchor_tr, nt_anchor_cell);
    let end_tr_index = GetIndex(table, focus_tr);
    let begin_tr_index = GetIndex(table, anchor_tr);
    if(begin_td_index > end_td_index) {
        const temp = end_td_index;
        end_td_index = begin_td_index; 
        begin_td_index = temp;
    }
    if(begin_tr_index > end_tr_index) {
        const temp = end_tr_index;
        end_tr_index = begin_tr_index; 
        begin_tr_index = temp;
    }
    end_tr_index++;
    end_td_index++;
    return {tr:{begin:begin_tr_index, end:end_tr_index}, td:{begin:begin_td_index, end:end_td_index}};
}

function CopySelectedCells(range){
    
    const table = nt_selected_cell.parentNode.parentNode;
    let text = "";

    let tr = table.childNodes.item(range.tr.begin);
    for(let k = range.tr.begin; k < range.tr.end; ++k){
        if(k!=1){ //skip table header bar //
            let td = tr.childNodes.item(range.td.begin);
            for(let i = range.td.begin; i < range.td.end; ++i){
                if(i != range.td.begin){
                    text += "\t";
                }
                text += MdFromChildNodes(td,0);                
                td = td.nextSibling;
            }
            text += "\n";
        }
        tr = tr.nextSibling;
    }
    
    return text;
}


function DeleteSelectedCells(range){    
    const table = nt_selected_cell.parentNode.parentNode;
    let tr = table.childNodes.item(range.tr.begin);
    for(let k = range.tr.begin; k < range.tr.end; ++k){
        if(k!=1){ //skip table header bar //
            let td = tr.childNodes.item(range.td.begin);
            for(let i = range.td.begin; i < range.td.end; ++i){
                RemoveNodeList(td,td.firstChild, null);
                AddNode("BR",td);
                td = td.nextSibling;
            }
        }
        tr = tr.nextSibling;
    }
    
}


function OnCutTable(event){
    
    console.log("fook cut on table");
    event.preventDefault();
    if(!nt_selected_cell) return;
    if(!event.clipboardData){
        console.error("event.clipboardData is not defined");
        return;
    }

    const range = RangeSelectedIndexes();
    const cell_text = CopySelectedCells(range);
    event.clipboardData.setData("text/plain", cell_text);

    //delete//
    undo_man.Begin(nt_selected_cell, NT_SELECT_CELL_MODE, nt_anchor_cell, NT_SELECT_CELL_MODE);
    DeleteSelectedCells(range);
    document.getSelection().collapse(nt_selected_cell, 0);
    undo_man.End(nt_selected_cell, 0);
    ReleaseTableSelectAll();
               
}

function OnCopyTable(event){

    console.log("fook copy on table");
    event.preventDefault();
    if(!nt_selected_cell) return;    
    if(!event.clipboardData){
        console.error("event.clipboardData is not defined");
        return;
    }

    const range = RangeSelectedIndexes();
    const cell_text = CopySelectedCells(range);
    event.clipboardData.setData("text/plain", cell_text);

}
           

function OnPasteTable(event){
    
    console.log("fook paste on table");
    event.preventDefault();
    if(!nt_selected_cell) return;    
    if(!event.clipboardData){
        console.error("event.clipboardData is not defined");
        return;
    }
    
    const text = ResolveNewlineCode(event.clipboardData.getData("text/plain"));
    if(!text) return;
    
    /*
    // algorism 1 //
    const spliter = ReadAsTabCSV(text);
    if(spliter){
        console.log("clipboard data can be regarded as table");

        const range = RangeSelectedIndexes();
        undo_man.Begin(nt_selected_cell, NT_SELECT_CELL_MODE, nt_anchor_cell, NT_SELECT_CELL_MODE);
        PasteCSVIntoTable(text, spliter, range);

        undo_man.End(nt_selected_cell, NT_SELECT_CELL_MODE, nt_anchor_cell, NT_SELECT_CELL_MODE);

        return;
    }
    */
    // algorism 2 //
    const md_text = TableMDFromCSV(text);
    const fragment = MD2DOM(md_text);
    if(!fragment)return;
    if(fragment.firstChild.nodeName == "TABLE"){
        InitializeMathInFragment(fragment, 0);
        InitializeCodeHighlight(fragment);
        const range = RangeSelectedIndexes();
        undo_man.Begin(nt_selected_cell, NT_SELECT_CELL_MODE, nt_anchor_cell, NT_SELECT_CELL_MODE);
        PasteTableToTable(fragment.firstChild, range);

        undo_man.End(nt_selected_cell, NT_SELECT_CELL_MODE, nt_anchor_cell, NT_SELECT_CELL_MODE);
    }

    console.log("clipboard data is not table");
}

/*
function ReadAsTabCSV(text){
    const split_char = '\t';
    let split_table=[];
    let offset = 0
    let pos_n = text.indexOf('\n', offset);
    while(pos_n>=0){
        split_table.push(ReadAsCSVLine(text, offset, pos_n,split_char));
        offset = pos_n+1;
        if(text.length < offset)return split_table;
        pos_n = text.indexOf('\n', offset);
    }
    split_table.push(ReadAsCSVLine(text, offset, text.length,split_char) );
    return split_table;
}

function ReadAsCSVLine(text, begin_index, end_index,split_char){
    let pos_n = text.indexOf('\n', begin_index);
    if(pos_n < 0) pos_n = text.length;
    
    
    let split_pos = [];
    split_pos.push(begin_index);
    let pos_t = text.indexOf(split_char, begin_index);
    while((pos_t >= 0) && (pos_t < end_index)){
        split_pos.push(pos_t);
        pos_t = text.indexOf(split_char, pos_t+1);
    }
    split_pos.push(end_index);
    return split_pos;  
} 


function PasteCSVIntoTable(text, spliter, range){
    
    const table = nt_selected_cell.parentNode.parentNode;
    let tr = table.childNodes.item(range.tr.begin);
    let row = 0;
    for(let k = range.tr.begin; k < range.tr.end; ++k){
        if(k!=1){ //skip table header bar //
            if(row >= spliter.length) break;
            const in_row = spliter[row]; 
            
            let begin_pos = in_row[0];
            let td = tr.childNodes.item(range.td.begin);
            for(let i = range.td.begin; i < range.td.end; ++i){
                const index = i - range.td.begin + 1;             
                if(index >= in_row.length) break;

                const end_pos = in_row[index];
                let is_succeeded = false;
                if(begin_pos+1 < end_pos){
                    const cell_text = text.slice(begin_pos, end_pos);
                    const fragment = MD2DOM(cell_text);
                    if(fragment){
                        InitializeMathInFragment(fragment,0);

                        if(fragment.firstChild){
                            let p_node = fragment.firstChild;
                            if(p_node.nodeName=="FIGURE"){
                                p_node = ConvertFiguretoP(p_node);
                            }

                            if(["P","H1","H2","H3","H4","H5","H6"].includes(p_node.nodeName)){
                                RemoveNodeList(td,td.firstChild,null);
                                const frag2 = new DocumentFragment();
                                while(fragment.firstChild.firstChild){
                                    frag2.appendChild(fragment.firstChild.removeChild(fragment.firstChild.firstChild));
                                }
                                
                                AddNodeList(td,td.firstChild,frag2);
                                //CorrectForTableCell(td);
                                is_succeeded = true;
                            }
                        }
                    }
                }
                
                if(!is_succeeded){
                    if(td.firstChild.nodeName !="BR"){
                        RemoveNodeList(td,td.firstChild,null);
                        AddNode("BR",td);
                    }
                }
                
                begin_pos = end_pos + 1;

                td = td.nextSibling;       
            } 
            ++row;        
        }
        tr = tr.nextSibling;
    }
    
}
*/

function CorrectForTableCell(td){
    let node = td.firstChild;
    while(node){
        let next = node.nextSibling;
        if(node.className == "math"){
            if(["editmathdisp","editcodedisp"].includes(node.lastChild.className)){
                
                RemoveNode(node);
                const focus = SafeJunctionPoint(next);
                if(focus){
                    next = focus.node;
                }
            }
        }
        node = next;
    }
}

function TableMDFromCSV(text){
    const split_char = '\t';
    let offset = 0
    let pos_n = text.indexOf('\n', offset);
    let md_text = "";

    let num_row = 0;
    
    while(pos_n>=0){
        const row_text = TableRowFromCSV(text, offset, pos_n);
        ++num_row;
        if(num_row == 2){
            if(!IsSecondLineOfTableMD(row_text)){
                md_text += "|---|\n";
                ++num_row;
            }
        }
        md_text += row_text + '\n';

        offset = pos_n + 1;
        pos_n = text.indexOf('\n', offset);
    }
    if(offset < text.length){
        md_text += TableRowFromCSV(text, offset, text.length) + '\n';
        ++num_row;
    }
    if(num_row == 1){
        md_text += "|---|\n";
        ++num_row;        
    }

    return md_text;
}

function TableRowFromCSV(text, begin_index, end_index){
    const split_char = '\t';
    let offset = begin_index
    let pos_t = text.indexOf('\t', offset);

    let md_text = (text.charAt(offset)!='|') ? '|' : "";

    while((pos_t>=0)&&(pos_t<end_index)){
        md_text += text.slice(offset, pos_t) + '|';
        
        offset = pos_t+1;
        pos_t = text.indexOf('\t', offset);
    }
    if(offset < end_index){
        md_text += text.slice(offset, end_index);
    }
    if(text.charAt(end_index - 1) != '|'){
        md_text += '|';
    }
    
    return md_text;
}


function PasteTableToTable(src_table, range){
    
    const table = nt_selected_cell.parentNode.parentNode;
    let tr = table.childNodes.item(range.tr.begin);
    let src_tr = src_table.firstChild;

    const range_width = (range.td.end - range.td.begin);
    const num_col = (range_width < src_tr.childNodes.length) ? range_width : src_tr.childNodes.length;
    
    for(let k = range.tr.begin; k < range.tr.end; ++k){
        if(k!=1){ //skip table header bar //
            if(src_tr){

                
                let src_td = src_tr.firstChild;
                let dest_td = tr.childNodes.item(range.td.begin);
                for(let i = 0; i < num_col; ++i){
                    const frag_new_tds = new DocumentFragment();
                    while(src_td.firstChild){
                        frag_new_tds.appendChild(src_td.removeChild(src_td.firstChild));
                    }   
                    RemoveNodeList(dest_td,dest_td.firstChild,null);
                    AddNodeList(dest_td,dest_td.firstChild,frag_new_tds);
                    dest_td = dest_td.nextSibling;
                    src_td = src_td.nextSibling;
                }
                for(let i = num_col; i <range_width; ++i){
                    RemoveNodeList(dest_td,dest_td.firstChild,null);
                    AddNode("BR", dest_td);
                    dest_td = dest_td.nextSibling;                
                }
                
                if(src_tr === src_table.firstChild) src_tr = src_tr.nextSibling; //skip second row//
                src_tr = src_tr.nextSibling;

            }else{
                let dest_td = tr.childNodes.item(range.td.begin);
                for(let i = 0; i <range_width; ++i){
                    RemoveNodeList(dest_td,dest_td.firstChild,null);
                    AddNode("BR", dest_td);
                    dest_td = dest_td.nextSibling;                
                }
            }
        }
        tr = tr.nextSibling;
    }
    
}

