"use strict";
/**********************************************
 * Translate from markdown(text) to HTML(DOM)
 **********************************************/

 /*
 text_buffer should be resolved for return code by using ResolveNewlineCode();
 */
function MD2DOM(text_buffer){
    
    //text_buffer = ReplaceAll(ReplaceAll(ReplaceAll(text_buffer, "\r\n", "\n"), "\r", "\n"), "\t", "    ");
    text_buffer = ReplaceAll(text_buffer, "\t", "    ");
    let parent = new DocumentFragment();
    //let offset = 0;
    
    const buffer_length = text_buffer.length;
    let i = 0;
    while( i < buffer_length ){
        const ch = text_buffer.charAt(i);  // if i is overflow, no error occur by charAt function//
        
        
        // judge P/OL/UL/H1 by head character//
        switch(ch){
        case '\n':
            {
                ++i;
                //offset = i;
            }
            break;
        case '#':
            {
                let k = i+1;
                let s = text_buffer.charAt(k);
                while(s==='#'){
                    k++;
                    s = text_buffer.charAt(k);                            
                }
                if(s===' '){
                    
                    let h1_node = document.createElement("H" + (k-i).toString());
                    let p_end = ParseH1(text_buffer, k + 1, h1_node);
                    parent.appendChild(h1_node);
                    i = p_end;
                    //offset = i;
                }else{
                    

                    let p_node = document.createElement("P");
                    let p_end = ParseP(text_buffer, k, p_node);
                    parent.appendChild(p_node);
                    i = p_end;
                    //offset = i;
                }
                
            }
            break;
        case '-':
        case '+':
        case '*':
            {
                let s = text_buffer.charAt(i+1);
                if(s===' '){
                    let ul_node = document.createElement("UL");
                    let p_end = ParseOLUL(text_buffer, i,  0, false, ul_node);
                    parent.appendChild(ul_node);
                    i = p_end;
                    //offset = i;
                }else{
                    let p_node = document.createElement("P");
                    let p_end = ParseP(text_buffer, i, p_node);
                    parent.appendChild(p_node);
                    i = p_end;
                    //offset = i;
                }
            }
            break;
        case ' ':
            {
                let k = i+1;
                let s = text_buffer.charAt(k);
                while(s ===' '){
                    ++k;
                    s = text_buffer.charAt(k);
                }

                if((s === '-') || (s === '+')|| (s === '*')){
                    if(k - i > 2) {
                        //list of child
                        alert("ERROR: child list is written but parent list is not found.");
                        //return ErrorTag(text_buffer, i, parent);
                        i = k;
                        break;
                    }
                }
                
                //go through into default//
                let p_node = document.createElement("P");
                let p_end = ParseP(text_buffer, i, p_node);
                parent.appendChild(p_node);
                i = p_end;
                //offset = i;
                
            }
            break;
        case '[':
            {
                let is_reference = false;
                let k = i+1;
                if( text_buffer.charAt(k) === "^" ){
                    const k_end = text_buffer.indexOf("]:",k+1);
                    if(k_end>0){
                        const npos = text_buffer.indexOf("\n",k+1);
                        if(((npos>0)&&(k_end<npos))||(npos<0)){
                            is_reference = true;

                            const math = document.createElement("SPAN");
                            math.className = "math";
                            const preview = document.createElement("SPAN");
                            preview.className = "previewref";
                            preview.appendChild(document.createTextNode(text_buffer.slice(k+1, k_end)));
                            math.appendChild(preview);
                            const edit = document.createElement("SPAN");
                            edit.className = "editref";
                            edit.appendChild(document.createTextNode(text_buffer.slice(i, k_end+2)));
                            math.appendChild(edit);

                            let begin_pos = k_end+2;
                            let s = text_buffer.charAt(begin_pos);
                            while(s ===' '){
                                ++begin_pos;
                                s = text_buffer.charAt(begin_pos);
                            }
                            
                            const p_node = document.createElement("P");   
                            p_node.appendChild(math);                         
                            const p_end = ParseLI(text_buffer, begin_pos, p_node);
                            CheckEmptyAndPutBR(p_node);
                            parent.appendChild(p_node);
                            i = p_end;
                        }
                    }
                }

                if(!is_reference){
                    //go through into default//
                    const p_node = document.createElement("P");
                    const p_end = ParseP(text_buffer, i, p_node);
                    parent.appendChild(p_node);
                    i = p_end;
                    //offset = i;
                }
            }
            break;
        default:            
            {
                if(('0' <= ch) && (ch <= '9')){      
                    
                    let k = i + 1;
                    let s = text_buffer.charAt(k);
                    while(('0' <= s) && (s <= '9')){ 
                        ++k;
                        s = text_buffer.charAt(k);
                    }
                    if(s==='.'){                            
                        ++k;
                        s = text_buffer.charAt(k);            
                        if(s===' '){
                            //child list//
                            let ol_node = document.createElement("OL");
                            let p_end = ParseOLUL(text_buffer, i, 0, true, ol_node);
                            parent.appendChild(ol_node); //here li_node is previous li node//
                            i = p_end;
                            //offset = i;
                            break;
                        }
                    }
                }
                
                let p_node = document.createElement("P");
                let p_end = ParseP(text_buffer, i, p_node);
                parent.appendChild(p_node);
                i = p_end;
                //offset = i;
                break;
            }
        }
    }

    if(!parent.hasChildNodes()){
        const p = document.createElement("P");
        p.appendChild(document.createElement("BR"));
        parent.appendChild(p);
    }

    ConnectAdjacentText(parent);
    PrepareBR(parent);

    PrepareTable(parent);
    LinebreakToSpaceInP(parent);
    PrepareFigure(parent);
    
    PrepareZWBR2(parent);

    AssertAllforMath(parent);

    return parent;
}

function ParseP(text_buffer, i_begin, parent){
    const buffer_length = text_buffer.length;
    let offset = i_begin;
    let i = i_begin;
    while( i < buffer_length){
        const ch = text_buffer.charAt(i);  // if i is overflow, no error occur by charAt function//
    
        switch(ch){
        case '\n':
            {
                /*
                //delete for table//
                if(i - offset > 0){
                    parent.appendChild(document.createTextNode( text_buffer.substring(offset, i)));
                }
                */

                
                const s = text_buffer.charAt(i+1);
                if((s === '\n') || (s==='')){
                    
                    //add for table//
                    if(i - offset > 0){
                        parent.appendChild(document.createTextNode( text_buffer.substring(offset, i)));
                    }                    

                    //end of p node//                    
                    CheckEmptyAndPutBR(parent);
                    return i + 1;                    
                }
                i++;
                //delete for table//offset = i;
                
            }
            break;            
        case '$':
            {
                if(i - offset > 0){
                    parent.appendChild(document.createTextNode( text_buffer.substring(offset, i)));
                }

                let p_end = ParseMath(text_buffer, i, parent);
                offset = p_end;
                i = p_end ;
                
            }
            break;       
        case '`':
            {
                if(i - offset > 0){
                    parent.appendChild(document.createTextNode( text_buffer.substring(offset, i)));
                }

                let p_end = ParseCode(text_buffer, i, parent);
                offset = p_end;
                i = p_end ;
                
            }
            break;
        case '*':   //for strong and em node//
            {   
                
                if(i - offset > 0){
                    parent.appendChild(document.createTextNode( text_buffer.substring(offset, i)));
                }
                const p_end = ParseEm(text_buffer, i, parent);
                offset = p_end;
                i = p_end;
                
            }
            break;        
        case '_':   //for strong and em node//
            {   
                if(! UnderscoreWithSpace(text_buffer, i)){
                    ++i;
                    break;
                }
                if(i - offset > 0){
                    parent.appendChild(document.createTextNode( text_buffer.substring(offset, i)));
                }
                const p_end = ParseEm(text_buffer, i, parent);
                offset = p_end;
                i = p_end;
                            
            }
            break;
        case '!':
            {
                if(i - offset > 0){
                    parent.appendChild(document.createTextNode( text_buffer.substring(offset, i)));
                }
                let p_end = ParseImg(text_buffer, i, parent);
                offset = p_end;
                i = p_end;
            }
            break;
        case '[':
            {
                if(i - offset > 0){
                    parent.appendChild(document.createTextNode( text_buffer.substring(offset, i)));
                }

                
                let p_end;
                if( text_buffer.charAt(i+1)==='^'){
                    p_end = ParseCite(text_buffer, i, parent);                    
                }else{
                    p_end = ParseA(text_buffer, i, parent);                    
                }
                offset = p_end;
                i = p_end;
            }
            break;
        case ' ':
            {
                let k = i+1;
                let s = text_buffer.charAt(k);
                while(s ===' '){
                    ++k;
                    s = text_buffer.charAt(k);
                }

                if(s==='\n'){
                    if(k-i>=2){
                        if(offset < i){
                            parent.appendChild(document.createTextNode( text_buffer.substring(offset, i)));
                        }
                        /*
                        //br tag//
                        let br_node = document.createElement("BR");
                        parent.appendChild(br_node);
                        */
                        i = k;
                        offset = i;
                        break;
                    }
                }
                i = k;
            }
            break;
        default:
            ++i;
        }
    }

    if(i - offset > 0){
        parent.appendChild(document.createTextNode( text_buffer.substring(offset, i)));
    }

    
    CheckEmptyAndPutBR(parent);
    return buffer_length;
}

function ParseH1(text_buffer, i_begin, parent){
    const buffer_length = text_buffer.length;
    let offset = i_begin;
    let i = i_begin;
    while( i < buffer_length ) {
        const ch = text_buffer.charAt(i);  // if i is overflow, no error occur by charAt function//
    
        switch(ch){
        case '\n':
            {
                if(i - offset > 0){
                    parent.appendChild(document.createTextNode( text_buffer.substring(offset, i)));
                }
                
                CheckEmptyAndPutBR(parent);
                return i + 1;
            }
            break;
        case '$':
            {
                if(i - offset > 0){
                    parent.appendChild(document.createTextNode( text_buffer.substring(offset, i)));
                }

                let p_end = ParseMath(text_buffer, i, parent, false);
                offset = p_end;
                i = p_end;

            }
            break;            
        case '`':
            {
                if(i - offset > 0){
                    parent.appendChild(document.createTextNode( text_buffer.substring(offset, i)));
                }

                let p_end = ParseCode(text_buffer, i, parent, false);
                offset = p_end;
                i = p_end;

            }
            break;
        case '*':   //for strong and em node//
            {   
        
                if(i - offset > 0){
                    parent.appendChild(document.createTextNode( text_buffer.substring(offset, i)));
                }
                const p_end = ParseEm(text_buffer, i, parent);
                offset = p_end;
                i = p_end;
            }
            break;
        case '_':   //for strong and em node//
            {   
                if(! UnderscoreWithSpace(text_buffer, i)){
                    ++i;
                    break;
                }
        
                if(i - offset > 0){
                    parent.appendChild(document.createTextNode( text_buffer.substring(offset, i)));
                }
                const p_end = ParseEm(text_buffer, i, parent);
                offset = p_end;
                i = p_end;
            }
            break;
        case '!':
            {
                if(i - offset > 0){
                    parent.appendChild(document.createTextNode( text_buffer.substring(offset, i)));
                }
                let p_end = ParseImg(text_buffer, i, parent);
                offset = p_end;
                i = p_end;
            }
            break;
        case '[':
            {
                if(i - offset > 0){
                    parent.appendChild(document.createTextNode( text_buffer.substring(offset, i)));
                }
                let p_end;
                if(text_buffer.charAt(i+1)==='^'){
                    p_end = ParseCite(text_buffer, i, parent);                    
                }else{
                    p_end = ParseA(text_buffer, i, parent);                    
                }                
                offset = p_end;
                i = p_end;
            }
            break;
        default:
            ++i;
        }
    }
    
    if(i - offset > 0){
        parent.appendChild(document.createTextNode( text_buffer.substring(offset, i)));
    }    
    CheckEmptyAndPutBR(parent);
    return buffer_length;
}


function ParseOLUL(text_buffer, i_begin, num_head_spaces, is_numbered, parent){
    /*
    let li_node = document.createElement("LI"); 
    let i = ParseLI(text_buffer, i_begin, li_node);
    parent.appendChild(li_node);
*/
    let li_node = null;
    let i = i_begin;
    const buffer_length = text_buffer.length;    
    let offset = i;
    
    while( i < buffer_length ) {
        const ch = text_buffer.charAt(i);  // if i is overflow, no error occur by charAt function//
        const space = i - offset;

        switch(ch){
        case '\n':
            {
                //return offset;   // i + 1 ??
                if(i > offset){
                    //end of list//
                    return offset;
                }else{
                    //ignore line-break within list
                    ++i;
                    offset=i;
                    continue;
                } 
            }
        case ' ':
            {                
                ++i;
                continue;
            }//through to next loop//
/*            
        case '$':
            {
                if(space < num_head_spaces){
                    //end of list//
                    return offset;
                }

                if(space >= num_head_spaces + 2){
                    if(text_buffer.charAt(i+1) == "$"){                                    
                        const p_end = ParseMath(text_buffer, i, li_node, true);
                        const math_text = li_node.lastChild.lastChild.firstChild.data;
                        li_node.lastChild.lastChild.firstChild.data = ReplaceAll(math_text, "\n" + " ".repeat(space), "\n");
                        offset = p_end;
                        i = p_end;
                        continue;
                    }
                }
                //go to default//
            }
            break;    
        case '`':
            {
                if(space < num_head_spaces){
                    //end of list//
                    return offset;
                }
                
                if(space >= num_head_spaces + 2){
                    if(text_buffer.slice(i+1, i+3) == "``"){     
                        const p_end = ParseCode(text_buffer, i, li_node, true);
                        const math_text = li_node.lastChild.lastChild.firstChild.data;
                        li_node.lastChild.lastChild.firstChild.data = ReplaceAll(math_text, "\n" + " ".repeat(space), "\n");
                        offset = p_end;
                        i = p_end;
                        continue;
                    }
                }
                //go to default//
            }
            break;
*/            
        case '-':
        case '+':
        case '*':
            {
                if(space < num_head_spaces){
                    //end of list//
                    return offset;
                }

                
                let s = text_buffer.charAt(i+1);
                if(s ==' '){
                    
                    if(space >=  num_head_spaces + 2){
                        //child list//
                        let ul_node = document.createElement("UL");
                        let p_end = ParseOLUL(text_buffer, offset, space, false, ul_node);
                        li_node.appendChild(ul_node); //here li_node is previous li node//
                        i = p_end;
                        offset = i;
                        continue;
                    }else if(is_numbered) {
                        //end of list because head mark of ol and ul is different//
                        return offset;
                    }else{
                        //continue list//
                        li_node = document.createElement("LI");    
                        let p_end = ParseLI(text_buffer, i + 2,  li_node);
                        parent.appendChild(li_node);
                        i = p_end;
                        offset = i;
                        continue;
                    }
                }
                //go to default//
            }
            break;
        default:
            {                              
                
                if(('0' <= ch) && (ch <= '9')){  

                    if(space < num_head_spaces){
                        //end of list//
                        return offset;
                    }

                    let k = i + 1;
                    let s = text_buffer.charAt(k);
                    while(('0' <= s) && (s <= '9')){ 
                        ++k;
                        s = text_buffer.charAt(k);
                    }
                    if(s =='.'){
                            
                        ++k;
                        s = text_buffer.charAt(k);            
                        if(s==' '){

                            if(space >=  num_head_spaces + 2){
                                //child list//
                                let ol_node = document.createElement("OL");
                                let p_end = ParseOLUL(text_buffer, offset, space, true, ol_node);
                                li_node.appendChild(ol_node); //here li_node is previous li node//
                                i = p_end;
                                offset = i;
                                continue;
                            }else if(!is_numbered) {
                                //end of list because head mark of ol and ul is different//
                                return offset;
                            }else{
                                //continue list//
                                li_node = document.createElement("LI");    
                                let p_end = ParseLI(text_buffer, k + 1, li_node);
                                parent.appendChild(li_node);
                                i = p_end;
                                offset = i;
                                continue;
                            }     
                        }
                    }

                }
            }
            break;
        }
        
        //default common routine for general character except for 'space'//
        if(space >= 2){
                
            //here, space >= 2. Then, it is connect with the previous list by br node
            //const br_node=li_node.appendChild(document.createElement("BR"));
            const p_end = ParseLI(text_buffer, i, li_node);                               
            i = p_end;
            offset = i;

        }else{
            //end of list//
            return offset;
        }


    }

    //end of list//
    return buffer_length;
}

function ParseLI(text_buffer, i_begin, parent){
    const buffer_length = text_buffer.length;
    let offset = i_begin;
    let i = i_begin;
    while( i < buffer_length ) {
        const ch = text_buffer.charAt(i);  // if i is overflow, no error occur by charAt function//

        switch(ch){
        case '\n':
            {
                if(i - offset > 0){
                    let text = text_buffer.substring(offset, i);
                    parent.appendChild(document.createTextNode(text));
                }
                
                //CheckEmptyAndPutBR(parent);
                return i + 1;
            }
        case '$':
            {
                if(i - offset > 0){
                    parent.appendChild(document.createTextNode( text_buffer.substring(offset, i)));
                }

                //let p_end = ParseMath(text_buffer, i, parent, false);
                const p_end = ParseMath(text_buffer, i, parent, true);
                //const math_text = parent.lastChild.lastChild.firstChild.data;
                //parent.lastChild.lastChild.firstChild.data = ReplaceAll(math_text, "\n" + " ".repeat(num_head_spaces), "\n");
                offset = p_end;
                i = p_end;

            }
            break;                
        case '`':
            {
                if(i - offset > 0){
                    parent.appendChild(document.createTextNode( text_buffer.substring(offset, i)));
                }

                //let p_end = ParseCode(text_buffer, i, parent, false);
                const p_end = ParseCode(text_buffer, i, parent, true);
                //const math_text = parent.lastChild.lastChild.firstChild.data;
                //parent.lastChild.lastChild.firstChild.data = ReplaceAll(math_text, "\n" + " ".repeat(num_head_spaces), "\n");
                offset = p_end;
                i = p_end;

            }
            break;
        case '*':   //for strong and em node//
            {                   
                if(i - offset > 0){
                    parent.appendChild(document.createTextNode( text_buffer.substring(offset, i)));
                }
                const p_end = ParseEm(text_buffer, i, parent);
                offset = p_end;
                i = p_end;
            }
            break;
        case '_':   //for strong and em node//
            {                   
                if(! UnderscoreWithSpace(text_buffer, i)){
                    ++i;
                    break;
                }
                
                if(i - offset > 0){
                    parent.appendChild(document.createTextNode( text_buffer.substring(offset, i)));
                }
                const p_end = ParseEm(text_buffer, i, parent);
                offset = p_end;
                i = p_end;
            }
            break;
        case '!':
            {
                if(i - offset > 0){
                    parent.appendChild(document.createTextNode( text_buffer.substring(offset, i)));
                }
                let p_end = ParseImg(text_buffer, i, parent);
                offset = p_end;
                i = p_end;
            }
            break;
        case '[':
            {
                if(i - offset > 0){
                    parent.appendChild(document.createTextNode( text_buffer.substring(offset, i)));
                }
                let p_end;
                if(text_buffer.charAt(i+1)==='^'){
                    p_end = ParseCite(text_buffer, i, parent);                    
                }else{
                    p_end = ParseA(text_buffer, i, parent);                    
                }                
                offset = p_end;
                i = p_end;
            }
            break;
        default:
            ++i;
        }

    }
    if(i - offset > 0){
        parent.appendChild(document.createTextNode( text_buffer.substring(offset, i)));
    }
    CheckEmptyAndPutBR(parent);
    
    return buffer_length;
}

function ParseMath(text_buffer, i_begin, parent, allow_display = true){

    let i = i_begin;
    let s = text_buffer.charAt(i+1);
    if(s === '$'){
        if(!allow_display){
            alert("ERROR: display math '$$' is not allowed here.");
            return ErrorTag(text_buffer, i, parent);
            //return i + 2;
        }
        //display math//
        let p = text_buffer.indexOf("$$", i+2);
        if(p < 0){
            alert("ERROR: end of display math '$$' is not found.");
            
            return ErrorTag(text_buffer, i, parent);
            //return i+2;
        }else{

            //remove head spaces//
            const prev_n = text_buffer.lastIndexOf("\n", i);
            const rep_str = "\n" + " ".repeat((prev_n < 0) ? i : i - prev_n - 1);            
            let math_text = text_buffer.substring(i, p+2);
            math_text = ReplaceAll(math_text, rep_str, "\n");

            //add new math block
            let span = document.createElement("SPAN");
            span.className="editmathdisp";
            span.appendChild(document.createTextNode(  math_text  ));
            let math = document.createElement("SPAN");
            math.className="math";
            math.appendChild(document.createElement("SPAN"));
            math.appendChild(span);
            parent.appendChild(math);
            return p + 2;
        }
    }else{
        //inline math//
        let p = text_buffer.indexOf("$", i+2);
        if(p < 0){
            alert("ERROR: end of inline math '$' is not found.");
            return ErrorTag(text_buffer, i, parent);
            //return i + 1;
        }else{
            let span = document.createElement("SPAN");
            span.className="editmath";
            span.appendChild(document.createTextNode( text_buffer.substring(i, p+1)));
            let math = document.createElement("SPAN");
            math.className="math";
            math.appendChild(document.createElement("SPAN"));
            math.appendChild(span);
            parent.appendChild(math);
            return p + 1;
        }
    }
}

function ParseCode(text_buffer, i_begin, parent, allow_display = true){

    let i = i_begin;
    const s = text_buffer.charAt(i+1);
    const s2 = text_buffer.charAt(i+2);
    if((s === '`')&&(s2 === '`')){
        if(!allow_display){
            alert("ERROR: display code '```' is not allowed here.");
            return ErrorTag(text_buffer, i, parent);
            //return i + 2;
        }
        //display math//
        let p = text_buffer.indexOf("```", i+3);
        if(p < 0){
            alert("ERROR: end of display code '```' is not found.");
            return ErrorTag(text_buffer, i, parent);
            //return i+2;
        }else{
            
            //remove head spaces//
            const prev_n = text_buffer.lastIndexOf("\n", i);
            const rep_str = "\n" + " ".repeat((prev_n < 0) ? i : i - prev_n - 1);            
            let math_text = text_buffer.substring(i, p+3);
            math_text = ReplaceAll(math_text, rep_str, "\n");

            //add new code block
            const pre = document.createElement("SPAN");
            pre.className="previewcodedisp";            
            pre.textContent="previewcodedisp";    
            const span = document.createElement("SPAN");
            span.className="editcodedisp";
            span.appendChild(document.createTextNode(  math_text  ));
            const math = document.createElement("SPAN");
            math.className="math";
            math.appendChild(pre);
            math.appendChild(span);
            parent.appendChild(math);
            return p + 3;
        }
    }else{
        //inline math//
        const p = text_buffer.indexOf('`', i+2);
        if(p < 0){
            alert("ERROR: end of inline code '`' is not found.");
            return ErrorTag(text_buffer, i, parent);
            //return i + 1;
        }else{
            const pre = document.createElement("SPAN");
            pre.className="previewcode";            
            pre.textContent="previewcode";            
            const span = document.createElement("SPAN");
            span.className="editcode";
            span.appendChild(document.createTextNode( text_buffer.substring(i, p+1)));
            const math = document.createElement("SPAN");
            math.className="math";
            math.appendChild(pre);
            math.appendChild(span);
            parent.appendChild(math);
            return p + 1;
        }
    }
}

function UnderscoreWithSpace(text_buffer, i_begin){
    const i = i_begin;
    const ch = text_buffer.charAt(i);
    if(i > 0){
        if(text_buffer.charAt(i-1) != ' '){ //empasis by '_' should be to begin by " _" and to end by "_ "//
            return false;
        }
    }
    let k = i + 1;
    while (text_buffer.charAt(k) === ch){
        k++;
    }
    const mark = ch.repeat(k-i);
    const p = text_buffer.indexOf(mark, k);
    if(p > 0){
        if(p + (k-i) < text_buffer.length){
            if(text_buffer.charAt(p + (k-i)) != ' '){//empasis by '_' should be to begin by " _" and to end by "_ "//
                return false;
            }
        }
    }

    const s = text_buffer.indexOf(' ', k);
    if((s > 0) && (s<p)){
        return false; //empasis by '_' should not include  " "//
    }

    return true;
}

function ParseEm(text_buffer, i_begin, parent){
    const i = i_begin;
    const ch = text_buffer.charAt(i);
    let k = i + 1;
    while (text_buffer.charAt(k) == ch){
        k++;
    }
    if(k-i <= 3){
        const mark = ch.repeat(k-i);
        //em (italic)
        const p = text_buffer.indexOf(mark, k+1);
        if(p < 0){
            alert("ERROR: end of enphasis " + mark +  " is not found.");
            return ErrorTag(text_buffer, i, parent);
            //return k;
        }else{
            const math =document.createElement("SPAN"); 
            math.className="math";
            if(k-i===1){
                const span = document.createElement("EM");    
                span.appendChild(document.createTextNode( text_buffer.substring(k, p)));
                math.appendChild(span);
            }else if(k-i===2){
                const span = document.createElement("STRONG");    
                span.appendChild(document.createTextNode( text_buffer.substring(k, p)));
                math.appendChild(span);
            }else{
                const span = document.createElement("STRONG");    
                span.appendChild(document.createTextNode( text_buffer.substring(k, p)));
                const span1 = document.createElement("EM");
                span1.appendChild(span);
                math.appendChild(span1);
            }
            const edit = document.createElement("SPAN"); 
            edit.className = "editem" + (k-i).toString();
            edit.appendChild( document.createTextNode( text_buffer.substring(i, p + (k-i))));
            
            math.appendChild(edit);
                        
            parent.appendChild(math);
            return p + (k-i);
            
        }
    }else{
        const mark = ch.repeat(k-i);
        alert("ERROR: emphasis mark " + mark + " is repeating greater than 3 characters.");
        return ErrorTag(text_buffer, i, parent);
        //return k;
    }  
}

function ParseImg(text_buffer, i_begin, parent){
    let k = i_begin + 1;
    if(text_buffer.charAt(k) !== '['){
        alert("ERROR: img '![]()' has no '[' symbol.");
        return ErrorTag(text_buffer, k, parent);
        
    }

    let k_end = text_buffer.indexOf(']', k+1);
    if(k_end < 0){        
        alert("ERROR: img '![]()' has no '' symbol.");
        return ErrorTag(text_buffer, k, parent);
        
    }

    let s = k_end + 1;
    while (text_buffer.charAt(s) === ' '){
        s++;
    }
    if(text_buffer.charAt(s) !== '('){
        alert("ERROR: link '[]()' has no '(' symbol.");
        return ErrorTag(text_buffer, k, parent);
        
    }

    let s_end = text_buffer.indexOf(')', s+1);
    if(s_end < 0){
        alert("ERROR: link '[]()' has no ')' symbol.");
        return ErrorTag(text_buffer, k, parent);
        
    }

    //here, this is image ///
    const math = document.createElement("SPAN");
    math.className = "math";
    const img =document.createElement("IMG"); 
    img.alt = text_buffer.substring(k+1, k_end);
    img.src = text_buffer.substring(s+1, s_end);
    math.appendChild(img);
    const edit = document.createElement("SPAN");
    edit.className = "editimg";
    edit.appendChild( document.createTextNode( text_buffer.substring(i_begin, s_end + 1) + " ")); //add space for margin//    
    math.appendChild(edit);   
    parent.appendChild(math);
    return s_end + 1;
}


function ParseA(text_buffer, i_begin, parent){
    let k = i_begin;

    let k_end = text_buffer.indexOf(']', k+1);
    if(k_end < 0){        
        //parent.appendChild(document.createTextNode('!'));
        alert("ERROR: link '[]()' has no ']' symbol.");
        return ErrorTag(text_buffer, k, parent);
            
    }

    let s = k_end + 1;
    while (text_buffer.charAt(s) === ' '){
        s++;
    }
    if(text_buffer.charAt(s) !== '('){
        //alert("ERROR: link '[]()' has no '(' symbol.");
        //return ErrorTag(text_buffer, k, parent);
        
        parent.appendChild(document.createTextNode( text_buffer.substring(i_begin, s)));
        return s;
    }

    let s_end = text_buffer.indexOf(')', s+1);
    if(s_end < 0){
        alert("ERROR: link '[]()' has no ')' symbol.");
        return ErrorTag(text_buffer, k, parent);
        
    }

    //here, this is a tag ///
    const math = document.createElement("SPAN");
    math.className = "math";
    const a =document.createElement("A"); 
    a.href = text_buffer.substring(s+1, s_end);
    a.target="_blank";
    a.ref="noopener noreferrer";
    a.appendChild( document.createTextNode(text_buffer.substring(k+1, k_end)));
    math.appendChild(a);
    const edit = document.createElement("SPAN");
    edit.className = "edita";
    edit.appendChild( document.createTextNode( text_buffer.substring(i_begin, s_end + 1)));    
    math.appendChild(edit);    
    parent.appendChild(math);
    return s_end + 1;
}

function ParseCite(text_buffer, i_begin, parent){
    let k = i_begin;

    let k_end = text_buffer.indexOf(']', k+1);
    if(k_end < 0){        
        alert("ERROR: cite '[^  ]' has no ']' symbol.");
        return ErrorTag(text_buffer, k, parent);
            
    }


    //here, this is a tag for cite///
    const math = document.createElement("SPAN");
    math.className = "math";
    const a =document.createElement("A"); 
    const text = text_buffer.substring(i_begin+2, k_end);
    a.href = "#" + text;
    //a.ref="noopener noreferrer";
    a.className = "previewcite";
    a.appendChild( document.createTextNode(  text  ));
    math.appendChild(a);
    const edit = document.createElement("SPAN");
    edit.className = "editcite";
    edit.appendChild( document.createTextNode(  "[^" + text + "] " ));    
    math.appendChild(edit);    
    parent.appendChild(math);
    return k_end + 1;


    
}


function GetEndSemantics(text_buffer, i_begin){
    const p_end = text_buffer.indexOf("\n", i_begin);
    return (p_end<0) ? text_buffer.length : p_end;
}


function ErrorTag(text_buffer, i_begin, parent){

    const i_end = GetEndSemantics(text_buffer, i_begin + 1);

    let span = document.createElement("EM");
    span.className="readerror";
    span.appendChild(document.createTextNode( text_buffer.substring(i_begin, i_end)));
    parent.appendChild(span);
    return i_end;
}

function CheckEmptyAndPutBR(parent){
    
    if(parent.childNodes.length===0){
        parent.appendChild(document.createElement("BR"));
    }else if(parent.childNodes.length===1){
        if(parent.firstChild.nodeType===Node.TEXT_NODE){
            if(parent.firstChild.data.trim().length===0){
                parent.removeChild(parent.firstChild);
                parent.appendChild(document.createElement("BR"));
            }
        }
    }
}

/*
   connect adjacent text nodes
*/
function ConnectAdjacentText(parent){
    let next=null;
    for(let node = parent.firstChild; node; node = next){
        next = node.nextSibling;
        if(node.nodeType===Node.TEXT_NODE){
            if(next){
                if(next.nodeType===Node.TEXT_NODE){
                    node.appendData(next.data);
                    parent.removeChild(next);
                    next = node; //do not move to next//
                }
            }
        }else if(node.hasChildNodes()){
            ConnectAdjacentText(node);
        }
    }
}

function PrepareBR(parent){
    let next=null;
    for(let node = parent.firstChild; node; node = next){
        next = node.nextSibling;
        if(node.hasChildNodes()){
            PrepareBR(node);
        }else{
            if(["P","LI","H1","H2","H3","H4","H5","H6","FIGCAPTION","TD","TH"].includes(node.nodeName)){
                node.appendChild(document.createElement("BR"));
            }
        }

        if(["LI", "FIGURE"].includes(node.nodeName)){
            if(["OL", "UL", "FIGCAPTION"].includes(node.firstChild.nodeName)){
                node.insertBefore(document.createElement("BR"), node.firstChild);
            }
        }
    }
}


/*
   convert from p node to figure node if the first child of p node is img tag.
*/
function PrepareFigure(parent){
    let next=null;
    for(let node = parent.firstChild; node; node = next){
        next = node.nextSibling;
        if(node.nodeName==="P"){
            if(node.firstChild.nodeName==="SPAN"){
                if(node.firstChild.className==="math"){
                    if(node.firstChild.lastChild.className === "editimg"){
                        //check the second node or later are IMG or not//
                        let first_text = null;
                        for(first_text = node.firstChild.nextSibling; first_text; first_text=first_text.nextSibling){
                            if(first_text.nodeName !== "SPAN"){
                                break;
                            }
                            if(first_text.className !== "math"){
                                break;
                            }
                            if(first_text.lastChild.className !== "editimg"){
                                break;
                            }
                        }
                        //create figure tag//
                        const figure = document.createElement("FIGURE");
                        while(node.firstChild !== first_text){
                            figure.appendChild(node.removeChild(node.firstChild));
                        }

                        const caption = document.createElement("FIGCAPTION");
                        while(node.firstChild){
                            caption.appendChild(node.removeChild(node.firstChild));                        
                        }
                        if(caption.firstChild===null){
                            caption.appendChild(document.createElement("BR"));
                        }  
                        figure.appendChild(caption);
                        parent.insertBefore(figure, node);
                        parent.removeChild(node);
                    }
                }
            }
        }
    }    
}


/*
    convert '\n' to ' '(space). 
    However, if the bothside of '\n' is Japanese code, the space is removed.
*/
function LinebreakToSpaceInP(parent){
    
    let next=null;
    for(let node = parent.firstChild; node; node = next){
        next = node.nextSibling;
        if(node.nodeName==="P"){
            for(let t_node = node.firstChild; t_node; t_node = t_node.nextSibling){
                if(t_node.nodeType===Node.TEXT_NODE){
                    const text = t_node.data;
                    if(text.indexOf('\n')>=0){
                        t_node.data = ReplaceLinebreakToSpaceForJP(text);
                    }                    
                }
            }
        }
    }
}


/*
   convert from p node to table node
*/
function PrepareTable(parent){
    let next=null;
    for(let node = parent.firstChild; node; node = next){
        next = node.nextSibling;
        if(node.nodeName==="P"){

            //finding first line break//
            let flb_node = null;
            let flb_offset = 0;
        
            for(let t_node = node.firstChild; t_node; t_node = t_node.nextSibling){
                if(t_node.nodeType===Node.TEXT_NODE){
                    const t_offset = t_node.data.indexOf('\n');
                    if(t_offset >= 0){
                        flb_node = t_node;
                        flb_offset = t_offset;
                        break;
                    }                    
                }
            }     
        
            if(flb_node===null) continue;

            //finding split mark '|' in first line//

            let has_split = false;
            for(let t_node = node.firstChild; t_node !== flb_node ; t_node = t_node.nextSibling){
                if(t_node.nodeType===Node.TEXT_NODE){
                    if(t_node.data.indexOf('|')>=0){
                        has_split=true;
                        break;
                    }                    
                }
            }            
            if(!has_split){
                const pos_split = flb_node.data.indexOf('|');
                if(pos_split<0)continue;
                if(pos_split>flb_offset)continue;
            }
        
            //finding second line break//
            const slb_offset = flb_node.data.indexOf('\n', flb_offset+1);
            const second_line = flb_node.data.slice(flb_offset + 1, (slb_offset<0)?flb_node.length : slb_offset);
            
            if(!IsSecondLineOfTableMD(second_line)) continue;
            //checking second line, which are composed of "-:| " only.//
            for(let i = 0; i < second_line.length; ++i){
                if("-:| ".indexOf(second_line[i]) < 0) continue;
            }
            
            //here, this p node is converted to table/////

            //split to row//
            const table = document.createElement("TABLE");
            {
                //const frag_tr = SplitLineToNodes(node, '\n', "TR");            
                const frag_tr = SplitLineToTD(node, '\n', "TR");            
                const tr1st = frag_tr.firstChild;
                {
                    const frag_td = SplitLineToTD(tr1st, '|', "TH");
                    tr1st.appendChild(frag_td);
                }
                const num_column = tr1st.childNodes.length;
                
                for(let tr = tr1st.nextSibling; tr ; tr = tr.nextSibling){
                    
                    const frag_td = SplitLineToTD(tr, '|', "TD");
                    
                    while(frag_td.childNodes.length > num_column){
                        frag_td.removeChild(frag_td.lastChild);
                    }

                    while(frag_td.childNodes.length < num_column){
                        const td = document.createElement("TD");
                        td.appendChild(document.createElement("BR"))
                        frag_td.appendChild(td);
                    }
                    tr.appendChild(frag_td);
                }

                table.appendChild(frag_tr);
            }
            
            parent.insertBefore(table, node);
            parent.removeChild(node);

                
        }//end of if P//
    }
}

//checking second line, which are composed of "-:| " only.//
function IsSecondLineOfTableMD(second_line){
    for(let i = 0; i < second_line.length; ++i){
        if("-:| ".indexOf(second_line[i]) < 0) return false;
    }
    if(second_line.indexOf('|') < 0) return false;
    if(second_line.indexOf('-') < 0) return false;
    return true;
}

function SplitLineToNodes(parent, symbol, tag_name){
    const fragment = new DocumentFragment();
    let td = document.createElement(tag_name);
    
    fragment.appendChild(td);
    let next = null;
    for(let node = parent.firstChild; node ; node = next){
        next = node.nextSibling;
        if(node.nodeType===Node.TEXT_NODE){
            let target = parent.removeChild(node);

            let pos_split = target.data.indexOf(symbol);
            while( pos_split >= 0 ){
                    
                if(pos_split > 0){
                    const after_text = target.splitText(pos_split);
                    td.appendChild(target);
                    target = after_text;
                }

                if(td.hasChildNodes()){
                    td = document.createElement(tag_name);
                }else{
                    if(fragment.firstChild!==td){
                        td.appendChild(document.createElement("BR"));
                        td = document.createElement(tag_name);
                    }
                }
                fragment.appendChild(td);
                if(target.length===1){
                    target.data = "";
                    break;
                }
                target = target.splitText(1);//remove first character that is symbol//
                pos_split = target.data.indexOf(symbol);

            }
            if(target.length>0){
                td.appendChild(target);    
            }
        }else{
            td.appendChild(parent.removeChild(node));
        }
    }

    if(!td.hasChildNodes()){//last node//
        td.remove();
    }

    return fragment;
}


function SplitLineToTD(parent, symbol, tag_name){
    
    
    for(let node = parent.firstChild; node ; node = node.nextSibling){
        if(node.nodeType === Node.TEXT_NODE){            
            const pos_split = node.data.indexOf(symbol);
            if(pos_split >= 0){
                if( pos_split > 0 ){  //split before symbol
                    const after = node.splitText(pos_split);
                    node = after;                    
                }

                if(node.length > 1){  //split after symbol
                    node.splitText(1);                    
                }
            }
        }
    }
        
    const fragment = new DocumentFragment();
    let td = document.createElement(tag_name);    
    

    //if sybbol is first charactor in te line, this is symbol to begin and we do not create td//
    if(parent.firstChild.nodeType===Node.TEXT_NODE){
        if(parent.firstChild.data == symbol){   // === must nut be used //
            parent.removeChild(parent.firstChild);
        }
    }

    while(parent.firstChild){
        if(parent.firstChild.nodeType===Node.TEXT_NODE){
            if(parent.firstChild.data == symbol){  // === must nut be used //
                parent.removeChild(parent.firstChild);
                
                //register current td//
                if(td.firstChild===null){
                    td.appendChild(document.createElement("BR"));
                }                
                fragment.appendChild(td);

                //create a new td//
                td = document.createElement(tag_name);    
                
                continue;
            }
        }

        //here, text without symbol or math like node//
        td.appendChild(parent.removeChild(parent.firstChild));
    }
    

    if(td.firstChild !== null){
        fragment.appendChild(td);
    }

    return fragment;
}


function PrepareZWBR2(parent){
    
    for(let node = parent.firstChild; node; node = node.nextSibling){
        switch(node.nodeName){
        case "P":
        case "H1":
        case "H2":
        case "H3":
        case "H4":
        case "H5":
        case "H6":
        case "LI":
        case "FIGCAPTION":
        case "TD":
        case "TH":
            {
                PrepereZWBR_funcP2(node);
            }
            break;
        }

        if(node.hasChildNodes()){
            PrepareZWBR2(node);
        }

    }
}

//for P, LI, H1, TD, TH, FIGURE, FIGCAPTION//
function PrepereZWBR_funcP2(p_node){
    if(p_node.firstChild===null){
        p_node.appendChild(document.createElement("BR"));
        return;
    }
    
    let is_prev_math = true;
    for(let node = p_node.firstChild; node; node = node.nextSibling){
        switch(node.nodeName){
        case "SPAN":
            if( is_prev_math ){
                p_node.insertBefore(document.createTextNode(nt_ZWBR), node);
            }
            is_prev_math = true;
            break;
        case "OL":
        case "UL":
        /*case "FIGCAPTION":*/
            if( is_prev_math ){
                if(node.previousSibling){
                    p_node.insertBefore(document.createTextNode(nt_ZWBR), node);
                }else{
                    p_node.insertBefore(document.createElement("BR"), node);
                }
            }       
            
            is_prev_math = false;
            break;
        case "BR":
            is_prev_math = false;
            break;
        default:
            is_prev_math = false;
        }

    }
    
    if( is_prev_math ){
        p_node.appendChild(document.createTextNode(nt_ZWBR));                
    }
};



const AssertAllforMath = (parent)=>{
    
    for(let node = parent.firstChild; node; node = node.nextSibling){
        if(["P","H1","H2","H3","H4","H5","H6","LI",/*"FIGURE",*/"FIGCAPTION","TD","TH"].includes(node.nodeName)){
            AssertValidateMathInParent(node);            
        }

        if(node.hasChildNodes()){
            AssertAllforMath(node);
        }
    }
}
