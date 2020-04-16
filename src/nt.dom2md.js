"use strict";

const nt_SPACE_FOR_LIST = "  ";

function DOM2MD(target_node){
    const list_rank = 0;
    return MdFromChildNodes(target_node, list_rank);
}

function MdFromChildNodes(parent, list_rank){
    let text_buffer = "";
    let node = parent.firstChild;
    while(node){
        text_buffer += MdFromNode(node, list_rank);
        node = node.nextSibling;
    }
    return text_buffer;
}


function MdFromList(parent, list_rank, head){
    let text_buffer = "";
    let li =  parent.firstChild;
    while(li){
        const text = MdFromChildNodes(li, list_rank + 1);
        //text_buffer += head + text;
        text_buffer += head + ReplaceAllExcept(text, "\n", "\n" + nt_SPACE_FOR_LIST, "\n");
        li = li.nextSibling;
        if(text_buffer[text_buffer.length-1] != "\n") {
            text_buffer += "\n";
        }
    }    
    
    return text_buffer;
}



function MdFromNode(node, list_rank){
    if(node.nodeType===Node.TEXT_NODE){
        if(node.data == nt_ZWBR){
            return "";
        }
        return node.data;
    }
    switch(node.tagName){
    case "BR": {
        if(node.parentNode.nodeName == "P"){
            return "  \n";
        }
        return "";
        /*if(node.nextSibling){
            if((node.nextSibling.tagName !=="OL") &&
                (node.nextSibling.tagName !=="UL")){
                return "  \n";
            }
        } 
        return "";
        */
    }
    case "P": {
        const text = MdFromChildNodes(node, list_rank);
        if(node.previousSibling){            
            if(text.length===0) {return "\n  \n";}
            else if(text[text.length - 1]==='\n') {return "\n" + text;}
            else {return "\n" + text + "\n";}            
        }else{
            if(text.length===0) {return "  \n";}
            else if(text[text.length - 1]==='\n') {return text;}
            else {return text + "\n";}    
        }
    }
    case "UL": {
        //const head = nt_SPACE_FOR_LIST.repeat(list_rank) + "- ";
        const head = "- ";
        const text = MdFromList(node, list_rank, head);
        if(list_rank === 0){
            if(node.previousSibling){
                if((node.previousSibling.tagName !=="P") &&
                (node.previousSibling.tagName !=="OL") &&
                (node.previousSibling.tagName !=="UL")){
                    return "\n\n" + text;
                }
            }            
        //}else{
            //if(node.previousSibling){
              //  if(node.previousSibling.tagName ==="OL"){
            //        return text;
                //}
            //}     
        }
        return "\n" + text;
    }
    case "OL": {
        //const head = nt_SPACE_FOR_LIST.repeat(list_rank) + "1. ";
        const head = "1. ";
        const text = MdFromList(node, list_rank, head);
        if(list_rank === 0){
            if(node.previousSibling){
                if((node.previousSibling.tagName !=="P") &&
                (node.previousSibling.tagName !=="OL") &&
                (node.previousSibling.tagName !=="UL")){
                    return "\n\n" + text;
                }
            }            
        //}else{
            //if(node.previousSibling){
              //  if(node.previousSibling.tagName ==="UL"){
          //          return text;
                //}
            //}
        }
        return "\n" + text;
    }
    case "SPAN":{
        if(node.className=="math"){    
            switch(node.lastChild.className){
            case "editmathdisp":
            case "editcodedisp":
            {
                let math_text = node.lastChild.firstChild.data;
                if(list_rank > 0){
                    return "\n\n" + math_text + "\n";                    
                }else{
                    if(node.previousSibling){
                        if(node.previousSibling.className=="math"){
                            const math_class = node.previousSibling.lastChild.className;
                            if((math_class == "editmathdisp") || (math_class == "editcodedisp")){
                                return math_text + "\n";
                            }
                        }
                        return "\n" + math_text + "\n";
                    }else{
                        return math_text + "\n";
                    }                    
                }
            }
            
            case "editimg":
            case "editcite":
                return node.lastChild.firstChild.data.slice(0,node.lastChild.firstChild.length - 1);
            case "editref":
                return node.lastChild.firstChild.data.slice(0,node.lastChild.firstChild.length) + " ";
            default:
                if(node.lastChild.firstChild.data.charAt(0)=='_'){ //for empasis by " _AB_ " format//
                    let text = node.lastChild.firstChild.data;
                    if(node.previousSibling){
                        if(node.previousSibling.nodeType===Node.TEXT_NODE){
                            if(node.previousSibling.data.charAt(node.previousSibling.length-1)!=' '){
                                text = ' ' + text;
                            }
                        }else{
                            text = ' ' + text;
                        }
                    }
                    if(node.nextSibling){
                        if(node.nextSibling.nodeType===Node.TEXT_NODE){
                            if(node.nextSibling.data.charAt(0)!=' '){
                                text = text + ' ';
                            }
                        }else{
                            text = text + ' ';
                        }
                    }
                    
                    return text;
                }else{
                    return node.lastChild.firstChild.data;
                }
            }
        }
        console.error("invalid span node cannot be changed:", node.className);
        return "";
    }
    case "H1":
    case "H2":
    case "H3":
    case "H4":
    case "H5":
    case "H6":
        {            
            const head = "#".repeat(parseInt(node.tagName.charAt(1), 10)) + " ";
            const text = MdFromChildNodes(node, list_rank);
            if(node.previousSibling){            
                if(text.length===0) {return "\n" + head + "  \n";}
                else if(text[text.length - 1]==='\n') {return "\n" + head + text;}
                else {return "\n" + head + text + "\n";}            
            }else{
                if(text.length===0) {return  head + "  \n";}
                else if(text[text.length - 1]==='\n') {return  head + text;}
                else {return head + text + "\n";}    
            }
        }        
    case "FIGURE":
        {
            let text = (node.previousSibling) ? "\n" : "";
            let img = node.firstChild;
            while(img){
                if(IsSpanMathImg(img)){
                    text += MdFromNode(img) + "\n";
                }else if(img.nodeName=="FIGCAPTION"){
                    break;
                }
                img = img.nextSibling;
            }
            if(img){
                text += MdFromChildNodes(img, list_rank);
            }
            
            if(text.length===0) {return "  \n";}
            else if(text[text.length - 1]==='\n') {return text;}
            else {return text + "\n";}    
            
        }
    case "TABLE":
        {
            let text = (node.previousSibling) ? "\n" : "";

            for(let tr = node.firstChild; tr; tr = tr.nextSibling){
                text += "|";
                for(let td = tr.firstChild; td; td = td.nextSibling){
                    let text_in_id = MdFromChildNodes(td, 0);
                    if(text_in_id[text_in_id.length-1]==='\n') {
                        text += text_in_id.slice(0,text_in_id.length-1) + "|";
                    }else{
                        text += text_in_id + "|";
                    }
                }
                text += "\n";
            }

            return text;// + "\n"; 
        }
    }

    alert("invalid node cannot be changed:"+ node.tagName);
    return "";
    
}


