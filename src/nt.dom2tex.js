"use strict";


function DOM2TEX(target_node){
    
    const head_text = TexHeader();
    const body_text = TexBody(target_node);
    const foot_text = TexFooter();
    
    return head_text + body_text + foot_text;
}

function TexHeader(){
    /* 
    //platex//
    let head_text = "";
    head_text += "\\documentclass[]{jarticle}\n"
    head_text += "\\usepackage{bm}\n"
    head_text += "\\usepackage[dvipdfmx]{graphicx}\n"
    head_text += "\\usepackage{ascmac}\n"
    head_text += "\\usepackage{fancybox}\n"
    head_text += "\\begin{document}\n"
    head_text += "\n"
    */
    
    let head_text = "";
    head_text += "\\documentclass{ltjsarticle}\n"
    head_text += "\\usepackage{bm}\n"
    head_text += "\\usepackage{graphicx}\n"
    head_text += "\\usepackage{fancybox}\n"
    head_text += "\\usepackage{ascmac}\n"
    head_text += "\\usepackage{amsmath}\n"
    head_text += "\\usepackage[luatex,pdfencoding=auto]{hyperref}\n"
    head_text += "\\begin{document}\n"
    head_text += "\n"
    
    return head_text;
}


function TexFooter(){
    let foot_text = "\n\\end{document}\n"
    return foot_text;
}

function TexBody(parent){ //modified from TexFromChildNodes to set first title//
    let list_rank = 0;
    let text_buffer = "";
    let node = parent.firstChild;
    if(node.nodeName == "H1"){
        const h1_text = TexFromChildNodes(node, list_rank);
        
        text_buffer += "\\title{";
        text_buffer +=  (h1_text[h1_text.length - 1]  == "\n") ? h1_text.slice(0,h1_text.length-1) : h1_text;
        text_buffer +=  "}\n";
        text_buffer +=  "\\maketitle\n\n";
        
        node = node.nextSibling;
        
    }

    let node_end = null;
    let num_ref = 0;
    {//find reference//
        let ref = parent.lastChild;
        while(ref !== node){
            let to_prev = false;
            if(ref.nodeName == "P"){
                let ch = ref.firstChild;
                if(ch.nodeType == Node.TEXT_NODE){
                    if(ch.data == nt_ZWBR){
                        ch = ch.nextSibling;
                    }
                }
                if(ch.nodeName == "SPAN"){
                    if(ch.lastChild.className == "editref"){
                        num_ref++;
                        node_end = ref;
                        if(ref !== node){
                            to_prev = true;
                            ref = ref.previousSibling;
                        }                        
                    }
                }
            }

            if(!to_prev) break;
        }
    }

    while(node !== node_end){
        text_buffer += TexFromNode(node, list_rank);
        node = node.nextSibling;
    }

    //reference//
    if(num_ref > 0){
        text_buffer += "\n\\begin{thebibliography}";
        text_buffer += ((num_ref < 10) ? "{9}\n" : "{99}\n");
        
        while(node){
            text_buffer += TexFromNode(node, list_rank);
            node = node.nextSibling;
        }
        text_buffer += "\\end{thebibliography}\n";
    }
    return text_buffer;
}

function TexFromChildNodes(parent, list_rank){
    let text_buffer = "";
    let node = parent.firstChild;
    while(node){
        text_buffer += TexFromNode(node, list_rank);
        node = node.nextSibling;
    }
    return text_buffer;
}


function TexFromList(parent, list_rank, head){
    let text_buffer = "";
    let li =  parent.firstChild;
    while(li){
        const text = TexFromChildNodes(li, list_rank + 1);
        //text_buffer += head + text;
        text_buffer += head + ReplaceAllExcept(text, "\n", "\n" + nt_SPACE_FOR_LIST, "\n");
        li = li.nextSibling;
        if(text_buffer[text_buffer.length-1] != "\n") {
            text_buffer += "\n";
        }
    }    
    
    return text_buffer;
}



function TexFromNode(node, list_rank){
    if(node.nodeType===Node.TEXT_NODE){
        if(node.data == nt_ZWBR){
            return "";
        }
        return ReplaceAll(ReplaceAll(node.data,"#","\\#"),"%","\\%");
        //return node.data;
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
        const text = TexFromChildNodes(node, list_rank);
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
        const head = "\\item ";
        let text = TexFromList(node, list_rank, head);
        text = "\\begin{itemize}\n" + text + "\\end{itemize}\n"
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
        const head = "\\item ";
        let text = TexFromList(node, list_rank, head);
        text = "\\begin{enumerate}\n" + text + "\\end{enumerate}\n"

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
                {
                    let math_text = node.lastChild.firstChild.data;
                    let p_s = math_text.indexOf("\\begin{align}");
                    if(p_s >= 0){
                        let p_e = math_text.indexOf("\\end{align}");
                        if(p_e < 0){
                            p_e = math_text.length;
                        }else{
                            p_e += "\\end{align}".length;
                        }
                        math_text = math_text.slice(p_s, p_e);
                    }else{
                        
                        if(math_text.indexOf("\\\\") >= 0){ //multi line//
                            math_text = "\\begin{align}"
                                + math_text.slice(2, math_text.length-2)
                                +  "\\end{align}";
                        }else{ //multi line//
                            math_text = "\\begin{equation}"
                                + math_text.slice(2, math_text.length-2)
                                +  "\\end{equation}";
                        }
                    }

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

            case "editcodedisp":
            {
                let math_text = node.lastChild.firstChild.data;
                let p_s = math_text.indexOf("\n");
                if(p_s > 3){
                    //Note: the other candidate of LaTeX command is framed and oframed//
                    math_text = "\\begin{itembox}[l]{" + math_text.slice(3,p_s) + "}\n\\begin{verbatim}"
                        + math_text.slice(p_s + 1, math_text.length-3) + "\\end{verbatim}\n\\end{itembox}"
                }else{
                    math_text = "\\begin{screen}\n\\begin{verbatim}" + math_text.slice(3, math_text.length-3) + "\\end{verbatim}\n\\end{screen}"
                }
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
                {
                    let p_s = node.lastChild.firstChild.data.indexOf("(");
                    if(p_s < 0) p_s = 0;
                    p_s++;
                    return "\\includegraphics{" + node.lastChild.firstChild.data.slice(p_s,node.lastChild.firstChild.length - 2) + "}";
                }
            case "edita":
                {
                    let t_e = node.lastChild.firstChild.data.indexOf("]");
                    if(t_e < 0) t_e = 1;
                    let p_s = node.lastChild.firstChild.data.indexOf("(", t_e);                    
                    if(p_s < 0) p_s = 0;
                    p_s++;
                    return "\\href{" + node.lastChild.firstChild.data.slice(p_s,node.lastChild.firstChild.length - 2)
                     + "}{" + node.lastChild.firstChild.data.slice(1,t_e) + "}";                        
                }
            case "editcite":
                return "\\cite{" + node.lastChild.firstChild.data.slice(2,node.lastChild.firstChild.length - 2) + "}";
            case "editref":
                return "\\bibitem{" + node.lastChild.firstChild.data.slice(2,node.lastChild.firstChild.length - 2) + "} ";
            case "editcode":
                //if \verb has problem, this will be changed to \texttt //
                return "\\ovalbox{ \\verb*`" + node.lastChild.firstChild.data.slice(1,node.lastChild.firstChild.length-1) + "` }";
            case "editem1":
                {
                    const mlen = 1;
                    let text = node.lastChild.firstChild.data.slice(mlen, node.lastChild.firstChild.length-mlen);
                    return "\\emph{" + text + "}";
                }
            case "editem2":                
                {
                    const mlen = 2;
                    let text = node.lastChild.firstChild.data.slice(mlen, node.lastChild.firstChild.length-mlen);
                    return "\\textbf{" + text + "}";
                }
            case "editem3":                
                {
                    const mlen = 3;
                    let text = node.lastChild.firstChild.data.slice(mlen, node.lastChild.firstChild.length-mlen);
                    return "\\textbf{\\emph{" + text + "}}";                
                }
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
            const head = TexSectionName(node.tagName) + "{";
            const text = TexFromChildNodes(node, list_rank);
            if(node.previousSibling){            
                if(text.length===0) {return "\n" + head + "}\n";}
                else if(text[text.length - 1]==='\n') {return "\n" + head + text.slice(0,text.length-1) + "}\n";}
                else {return "\n" + head + text + "}\n";}            
            }else{
                if(text.length===0) {return  head + "}\n";}
                else if(text[text.length - 1]==='\n') {return  head + text.slice(0,text.length-1) + "}\n";}
                else {return head + text + "}\n";}    
            }
        }        
    case "FIGURE":
        {
            let text = (node.previousSibling) ? "\n" : "";
            text += "\\begin{figure}[h]\n";
            text += "\\begin{center}\n";
            let img = node.firstChild;
            while(img){
                if(IsSpanMathImg(img)){
                    text += TexFromNode(img) + "\n";
                }else if(img.nodeName=="FIGCAPTION"){
                    break;
                }
                img = img.nextSibling;
            }
            if(img){//FIGCAPTION//
                text += "\\caption{" + TexFromChildNodes(img, list_rank) + "}\n";
            }
            text += "\\end{center}\n";
            text += "\\end{figure}\n";
            
            if(text.length===0) {return "  \n";}
            return text;
            
            
        }
    case "TABLE":
        {
            let text = (node.previousSibling) ? "\n" : "";

            text += "\\begin{table}[h]\n";
            text += "\\begin{tabular}";

            {//align//
                let align_text = "{";
                const tr2 = node.firstChild.nextSibling;
                for(let td = tr2.firstChild; td; td = td.nextSibling){
                    if(td[0] == ":"){
                        if(td[td.length-1] == ":"){
                            align_text += "c";
                        }else{
                            align_text += "l";
                        }
                    }else{
                        if(td[td.length-1] == ":"){
                            align_text += "r";
                        }else{
                            align_text += "l";
                        }
                    }
                }
                text += align_text + "}  \\hline\n";
            }


            for(let tr = node.firstChild; tr; tr = tr.nextSibling){
                if(tr === node.firstChild.nextSibling){
                    text += "\\hline\n";
                }else{
                    //text += "|";
                    for(let td = tr.firstChild; td; td = td.nextSibling){
                        let text_in_id = TexFromChildNodes(td, 0);
                        if(text_in_id[text_in_id.length-1]==='\n') {
                            text += text_in_id.slice(0,text_in_id.length-1);
                        }else{
                            text += text_in_id;
                        }
                        if(td.nextSibling){
                            text += "&"
                        }
                    }

                    text += "\\\\\n";
                }
            }

            text += "\\hline\n";
            text += "\\end{tabular}\n";
            text += "\\end{table}\n";
          
            return text;// + "\n"; 
        }
    }

    alert("invalid node cannot be changed:"+ node.tagName);
    return "";
    
}


function TexSectionName(tagName){
    switch(tagName){
    case "H1": return "\\part";
    case "H2": return "\\section";
    case "H3": return "\\subsection";
    case "H4": return "\\subsubsection";
    case "H5": return "\\paragraph";
    case "H6": return "\\subparagraph";
    }
}
