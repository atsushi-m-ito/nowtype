"use strict";

let nt_highlight = null;

function IsHighlightMode(){
    return !(nt_highlight===null);
}

class Highlighter {
    
    constructor(master_node, word) {
        this.master_node = master_node;
        this.word = word;
        this.change_list = [];
        
        this.SearchAndMark(master_node);
    }
    
    SearchAll(){
        this.SearchAndMark(this.master_node);
    }

    SearchIn(parent_set){
        parent_set.forEach((parent)=>{
            this.SearchAndMark(parent);
        });
    }        

    SearchAndMark(parent){
        let next;
        for(let node = parent.firstChild; node; node = next){
            next = node.nextSibling;
            if(node.nodeType == Node.TEXT_NODE){
                const fragment = this.Marking(node);
                if(fragment){
                    let highlight_node_list = [];
                    fragment.childNodes.forEach((n)=>{highlight_node_list.push(n);});
                    
                    this.change_list.push({
                        original: node, 
                        highlight_node_list:highlight_node_list,
                        length:fragment.childNodes.length,
                        parent: parent, 
                        offset: GetIndex(parent, node) 
                    });
                    const ref = node.nextSibling;
                    parent.removeChild(node);
                    parent.insertBefore(fragment, ref);
                }
            }else{
                if(node.nodeName != "SPAN"){
                    this.SearchAndMark(node);
                }
            }
        }
        return true;
    }

    Marking(text_node, word = this.word){
        const text = text_node.data;
        const length = text.length;
        const width = word.length;
        let offset = 0;
        let p = text.indexOf(word, offset);
        if(p < 0)return null;

        const fragment = new DocumentFragment();
        while (p >= 0){
            const tnode = document.createTextNode(text.slice(offset, p));
            fragment.appendChild(tnode);
            const mark = document.createElement("MARK");
            mark.appendChild(document.createTextNode(word));
            fragment.appendChild(mark);
            offset = p + width;
            p = text.indexOf(word, offset);
        }

        if(offset < length){
            const tnode = document.createTextNode(text.slice(offset));
            fragment.appendChild(tnode);
        }

        return fragment;
    }

    /*
        Repair: remove highlight according to change_list
    */
    RepairAll(){
        while(this.change_list.length > 0){
            const info = this.change_list.pop();            
            const parent = info.parent;
            parent.insertBefore(info.original, info.highlight_node_list[0]);
            info.highlight_node_list.forEach((n)=>{
                parent.removeChild(n);
            });
        }
    }

    /*
    Register undo list if the highlight position is included in parent_set.  
    And, the info of the highlight position is removed in change_list.
    */
    RegisterUndo(parent_set, undo_man){
        this.change_list.forEach((info)=>{
            if(parent_set.has(info.parent)){
                undo_man.Register(UR_TYPE.REMOVE_NODE, info.original, info.parent, info.offset, 1);
                
                let i = 0;
                info.highlight_node_list.forEach((n)=>{
                    undo_man.Register(UR_TYPE.ADD_NODE, n, info.parent, info.offset+i, 1);
                    ++i;
                });
                
                //flag for remove//
                info.parent = null;
            }
        });

        this.change_list = this.change_list.filter(info => info.parent !== null );
    }

    /*
        ForceRemove: remove highlight not according to change_list.
        This method will be called just after IME compositionend.
        And operation is registerd in undo history.
    */
    ForceRepairWithRegister(parent_set, fnode, foffset){
        let new_focus = null;
        parent_set.forEach((parent)=>{
            const focus = this.SearchAndRepairWithRegister(parent, fnode, foffset);
            if(focus){
                new_focus = focus;
            }
        });
        return new_focus;
    }

    
    SearchAndRepairWithRegister(parent, fnode, foffset){
        let new_focus = null;
        let begin_text = "";
        let is_found = false;
        let next;
        for(let node = parent.firstChild; node; node = next){
            next = node.nextSibling;
            if(node.nodeName == "MARK"){
                if(is_found == false){
                    is_found = true;
                    if(node.previousSibling){
                        if(node.previousSibling.nodeType==Node.TEXT_NODE){
                            begin_text += node.previousSibling.data;
                            RemoveNode(node.previousSibling);
                        }                    
                    }
                }
                if(node.firstChild === fnode){
                    new_focus = {node: null, offset: begin_text.length + foffset};
                }
                begin_text += node.textContent;
                RemoveNode(node);
            }else if(node.nodeType == Node.TEXT_NODE){
                if(node === fnode){
                    new_focus = {node: node, offset: begin_text.length + foffset};
                }
                if(is_found){
                    begin_text += node.data;
                    RemoveNode(node);
                }
            }else{
                if(is_found){
                    is_found = false;
                    const add_node = AddTextNode(begin_text, parent, node);
                    begin_text = "";

                    if(new_focus){
                        new_focus.node = add_node;
                    }
                }
                const ret_focus = this.SearchAndRepairWithRegister(node, fnode, foffset);
                if(ret_focus){
                    new_focus = ret_focus;
                }
            }
        }
        if(is_found){
            const add_node = AddTextNode(begin_text, parent, null);
            if(new_focus){
                new_focus.node = add_node;
            }
        }
        return new_focus;
    }

    OriginalFocus(node, offset){
        if(node.nodeType != Node.TEXT_NODE) return {node,offset};
        
        const parent = (node.parentNode.nodeName=="MARK") ? 
                node.parentNode.parentNode : node.parentNode;
        

        for(let k=0; k < this.change_list.length; ++k){
            const info = this.change_list[k];
            if(info.parent === parent){
                if(info.highlight_node_list.includes(
                    (node.parentNode.nodeName=="MARK") ? node.parentNode : node))
                {
                    let org_offset = 0;
                    for(let i = 0; i < info.highlight_node_list.length; ++i){
                        if(info.highlight_node_list[i] === node){
                            org_offset += offset;
                            break;
                        }else if(info.highlight_node_list[i] === node.parentNode){ //for MARK//
                            org_offset += offset;                            
                            break;
                        }
                        org_offset += (info.highlight_node_list[i].nodeName=="MARK") ? 
                            info.highlight_node_list[i].firstChild.length: info.highlight_node_list[i].length;

                            
                    }
                    return {node:info.original, offset:org_offset};
                }
                
            }
            
        }
       
        return {node,offset}; //not find//
    }

    

    HighlightFocus(node, offset){
        if(node.nodeType != Node.TEXT_NODE) return {node,offset};
        

        for(let k=0; k < this.change_list.length; ++k){
            const info = this.change_list[k];
            if(info.original === node){
                
                let sum_offset = 0;
                for(let i = 0; i < info.highlight_node_list.length; ++i){
                    const textnode = (info.highlight_node_list[i].nodeName=="MARK") ? 
                        info.highlight_node_list[i].firstChild : info.highlight_node_list[i];
                    
                    sum_offset += textnode.length;
                    if(sum_offset >= offset){
                        return {node:textnode, offset:textnode.length - (sum_offset - offset)};
                    }
                }
                
                return {node:info.original, offset:info.highlight_node_list[info.highlight_node_list.length-1].length};
            }
            
        }
        return {node,offset}; //not find//
    }

    get Word(){
        return this.word;
    }

}


function NT_HighlightWord(word, keep_selection = true){
    if(IsTableSelectionMode()){
        ReleaseTableSelectAll();
    }

    if(nt_highlight) {
        if(nt_highlight.Word == word) return true;
        if(!NT_HighlightClear(keep_selection)) return false;
    }


    const selection = document.getSelection();
    let focus = CorrectFocusToText2(selection.focusNode, selection.focusOffset);
    const is_collapsed = selection.isCollapsed;
    let anchor = (is_collapsed) ? focus : CorrectFocusToText2( selection.anchorNode, selection.anchorOffset);
    
    nt_highlight = new Highlighter(nt_render_div, word);

    if(keep_selection){
        focus = nt_highlight.HighlightFocus(focus.node, focus.offset);
        if(is_collapsed){
            selection.collapse( focus.node, focus.offset);
        }else{
            anchor = nt_highlight.HighlightFocus(anchor.node, anchor.offset);
            selection.setBaseAndExtent(anchor.node, anchor.offset, focus.node, focus.offset);
        }
    }
}

function NT_HighlightClear(keep_selection = true){
    if(nt_highlight){
        const selection = document.getSelection();        
        let focus = CorrectFocusToText2(selection.focusNode, selection.focusOffset);
        focus = nt_highlight.OriginalFocus(focus.node, focus.offset);
        
        if(selection.isCollapsed){            
            nt_highlight.RepairAll();        
            nt_highlight = null;
            
            if(keep_selection){
                selection.collapse(focus.node, focus.offset);
            }
        }else{
            let anchor = CorrectFocusToText2( selection.anchorNode, selection.anchorOffset);            
            anchor = nt_highlight.OriginalFocus(anchor.node, anchor.offset);
        
            nt_highlight.RepairAll();        
            nt_highlight = null;
        
            if(keep_selection){
                selection.setBaseAndExtent(anchor.node, anchor.offset, focus.node, focus.offset);
            }
        }                
        
        return true;
    }
    return false;
}

