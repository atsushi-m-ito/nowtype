"use strict";

class StoredNode {
    
    constructor(node) {
        this.real_instance = node;
        this.nodeName = node.nodeName;
        this.text_class = (node.nodeType===Node.TEXT_NODE) ? node.data : node.className;
        this.children = [];     
        
        //AddChildren
        for(let ch = node.firstChild; ch; ch = ch.nextSibling){
            this.children.push(new StoredNode(ch));
        } 
    }
    
    IsSame(node){
        

        return true;
    }

}


