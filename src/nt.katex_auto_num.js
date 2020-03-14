"use strict";

/*
This is the KATEX extention to add auto numbering.

The KATEX standard recommendation is to use \tags{number}.
However, \tag can only give one expression number to a multi-line expression with begin {aligned}.
I made this extension to give an expression number per line.
*/

/*
map {label, eqnumber} data
*/
let g_label_eqnumber = new Map();


function katexAutoNumber(mathtext, parent, number){
    const word_begin = "\\begin{align}";
    const pos = mathtext.indexOf(word_begin);

    
    if(pos < 0){//align is not used//        
        return katexAutoNumber_woAligned(mathtext, parent, number);
    }else{//align is used//
        mathtext = ReplaceAll(mathtext, "{align}", "{aligned}");
        return katexAutoNumber_withAligned(mathtext, pos, parent, number);
    }
}


/*
case that \begin{aligned} is not used
*/
function katexAutoNumber_woAligned(mathtext, parent, number){
    //analyze which \nonumber is written or not.
    let line_br_points = ListupBr(mathtext, 0);

    //find nonumber /////////////////////////////////////////////////////////
    let line_has_nonumber = ListUpNonumber(mathtext, line_br_points);
    
    //find label ///////////////////////////////////////////////////////////
    let line_has_label = ListUpLabel(mathtext, line_br_points);
    
    //rgister label(key) and eq.number /////////////////////////////
    RegisterLabelEqnumber(line_has_nonumber, line_has_label, number);

    //vanish nonumber and label because it is not supported by katex//
    mathtext = ReplaceAll(mathtext, "\\nonumber", " ");
    mathtext = ReplaceByRangeAll(mathtext, "\\label{", "}", " ");

    //change ref{...} to equation number//
    mathtext = ReferLabelEqnumber(mathtext);

    
    parent.insertAdjacentHTML('afterbegin', katex.renderToString(mathtext, {output: "html", displayMode: true, throwOnError: false }));

    let katex_html = FindFirstChild("katex-html",parent.firstElementChild );
    if(katex_html === null) return 0;        
    
    //let node = katex_html.firstElementChild;
    let base = katex_html.firstElementChild;
    if( base === null ) return 0;
    if(base.className !== "base") return 0;
    let b_parent = base.parentElement; 
    let tag = null;
    let i_line = 0;
    let my_number = number;

    //make span of "tag" and clone property from base//
    while(base){
        
        if(line_has_nonumber[i_line]){
            tag = null;
        }else{
            //numbering//////////////////////////////////
            tag = document.createElement("SPAN");
            tag.className="tag"; 
            tag.appendChild(base.firstElementChild.cloneNode(true));
            if(tag.firstElementChild.className !== "strut"){alert("ERROR: auto numbering is miss");}
            tag.appendChild(document.createTextNode("(" + my_number + ")"));

            //register label and number///////////////////////


            //increment///////////////////////////////////////
            my_number++;
        }

        base = base.nextElementSibling;
        while(base){
            if(base.className==="mspace newline"){
                let next = base.nextElementSibling;
                if(tag){
                    base.before(tag);
                    tag = null;
                }
                base = next;
                break;
            }
            base = base.nextElementSibling;
        }
        ++i_line;
    }
    if(tag){
        b_parent.appendChild(tag);
        tag = null;
    }

    
    return my_number - number;
}

/*
 case that \begin{aligned} is used
*/
function katexAutoNumber_withAligned(mathtext, pos_begin, parent, number){

    {//aligned is used//

        //analyze which nonumber is written or not.
        let line_br_points = ListupBr(mathtext, pos_begin + "\\begin{aligned}".length);        

        //find nonumber /////////////////////////////////////////////////////////
        let line_has_nonumber = ListUpNonumber(mathtext, line_br_points);

        //find label ///////////////////////////////////////////////////////////
        let line_has_label = ListUpLabel(mathtext, line_br_points);

        //rgister label(key) and eq.number /////////////////////////////
        RegisterLabelEqnumber(line_has_nonumber, line_has_label, number);

        //vanish nonumber and label because it is not supported by katex//
        mathtext = ReplaceAll(mathtext, "\\nonumber", " ");
        mathtext = ReplaceByRangeAll(mathtext, "\\label{", "}", " ");

        //change ref{...} to equation number//
        mathtext = ReferLabelEqnumber(mathtext);

        // rendering and hack to give expression number per line.
        mathtext = "\\tag{" + number + "}" + mathtext;
        parent.insertAdjacentHTML('afterbegin', katex.renderToString(mathtext, {output: "html", displayMode: true, throwOnError: false }));

        let katex_html = FindFirstChild("katex-html",parent.firstElementChild );
        if(katex_html === null) return 0;        
        
        //let node = katex_html.firstElementChild;
        let base = katex_html.firstElementChild;
        if(base.className !== "base") return 0;
        let tag = base.nextElementSibling;
        if(tag.className !== "tag") return 0;
        
        
        let mtable = FindFirstChild("mtable", base.firstElementChild.nextElementSibling );
        if(mtable===null) return 0;

        let mtable_clone = mtable.cloneNode(true);
        {
            let first = mtable_clone.firstChild;
            while(first.nextSibling){
                first.nextSibling.remove();
            }
        }

        let vlist_r = FindFirstChild("vlist-r", mtable_clone.firstElementChild );
        if(vlist_r===null) return 0;

        let vlist = FindFirstChild("vlist", vlist_r.firstElementChild );
        if(vlist===null) return 0;

        console.log("vlist.childNodes.length = " + vlist.childNodes.length);
        let ve = vlist.firstElementChild;
        let my_number = number;
        let i = 0;
        while(ve){
            let pstrut = FindFirstChild("pstrut", ve.firstElementChild );
            if(pstrut){
                let mord = pstrut.nextElementSibling;
                if(mord.className==="mord"){
                    while(mord.firstChild){
                        mord.removeChild(mord.firstChild);
                    }
                    if(!line_has_nonumber[i]){
                        //numbering/////////////////////////////
                        mord.appendChild(document.createTextNode("(" + my_number + ")"));
                        my_number++;
                    }else{
                        mord.appendChild(document.createTextNode(" "));                        
                    }
                }
            }
            ve = ve.nextElementSibling;
            ++i;
        }

        let tag_mord_text = tag.firstElementChild.nextElementSibling;
        if(tag_mord_text===null)return 0;
        while(tag_mord_text.firstChild){
            tag_mord_text.removeChild(tag_mord_text.firstChild);
        }
        tag_mord_text.appendChild(mtable_clone);

        return my_number - number;
    }

}

function FindFirstChild(class_name, start ){
    let node = start;
    while(node){
        if(node.className===class_name){
            return node;
        }
        node = node.firstElementChild;
    }
    return node;

}

function FindEndPos(text, offset){
    let p_begin = text.indexOf("\\begin", offset);
    let p_end = text.indexOf("\\end", offset);
        
    while(p_begin >= 0){
        if(p_end < p_begin )   {
            return p_end;
        }else{
            offset = FindEndPos(text, p_begin + 1);
            offset++;
        }
        p_begin = text.indexOf("\\begin", offset);
        p_end = text.indexOf("\\end", offset);        
    }
    return p_end;
}

function ListupBr(mathtext, offset_begin){
    //analyze which \nonumber is written or not.
    let line_br_points = [];  // list the positions of "\\\\" //
    {
        let offset = offset_begin;
        let p_begin = mathtext.indexOf("\\begin", offset);
        let p_br = mathtext.indexOf("\\\\", offset);
        while(p_br >= 0){
            if(p_begin >= 0){
                if(p_br < p_begin){
                    line_br_points.push(p_br);
                    offset = p_br + 1; 
                    p_br = mathtext.indexOf("\\\\", offset);
                }else{
                    offset = FindEndPos(mathtext, p_begin+1);       
                    offset++;
                    p_begin = mathtext.indexOf("\\begin", offset);
                    p_br = mathtext.indexOf("\\\\", offset);
                }
            }else{
                line_br_points.push(p_br);
                offset = p_br + 1;
                p_br = mathtext.indexOf("\\\\", offset);
            }
        }
        line_br_points.push(mathtext.length);
    }
    return line_br_points;
}

function ListUpNonumber(mathtext, line_br_points){

    //find \\nonumber /////////////////////////////////////////////////////////
    let line_has_nonumber = [];  // list of bool which indicate the nonumber is written per line //
    {
        let p_nonumber = mathtext.indexOf("\\nonumber", 0);
        let i = 0;
        while(p_nonumber >= 0){
        
            if(line_br_points[i] < p_nonumber){
                line_has_nonumber.push(false);
            }else{
                line_has_nonumber.push(true);
                p_nonumber = mathtext.indexOf("\\nonumber", line_br_points[i]);
            }
            ++i
            if( i >= line_br_points.length)    break;
        
        }
        while( i < line_br_points.length){
            line_has_nonumber.push(false);
            ++i
        }

        if(line_br_points.length !== line_has_nonumber.length){
            alert("ERROR: analize nonumber in multi-line equations");
        }
    }
    return line_has_nonumber;
}


function ListUpLabel(mathtext, line_br_points){

    //find \\nonumber /////////////////////////////////////////////////////////
    let line_has_label = [];  // list of bool which indicate the nonumber is written per line //
    {
        let p_label = mathtext.indexOf("\\label", 0);
        let i = 0;
        while(p_label >= 0){
        
            if(line_br_points[i] < p_label){
                line_has_label.push("");
            }else{
                const ib = mathtext.indexOf("{", p_label + 6);
                if(ib < 0){
                    line_has_label.push(""); //error//
                    alert("ERROR: \\label does not has next { character");
                }else{
                    const ie = mathtext.indexOf("}", ib + 1);
                    if(ie < 0){
                        line_has_label.push(""); //error//
                        alert("ERROR: \\label does not has next } character");
                    }else{
                        let word = mathtext.slice(ib + 1, ie);
                        line_has_label.push(word.trim());
                    }
                }
                p_label = mathtext.indexOf("\\label", line_br_points[i]);
            }
            ++i
            if( i >= line_br_points.length)    break;
        
        }
        while( i < line_br_points.length){
            line_has_label.push("");
            ++i
        }

        if(line_br_points.length !== line_has_label.length){
            alert("ERROR: analize label in multi-line equations");
        }
    }
    return line_has_label;
}

function RegisterLabelEqnumber(line_has_nonumber, line_has_label, number) {
    const i_end = line_has_label.length;
    for (let i = 0; i < i_end; ++i) {
        if (!line_has_nonumber[i]) {
            if (line_has_label[i].length > 0) {
                g_label_eqnumber.set( line_has_label[i], number);
            }
            number++;
        }

    }
}

function ReferLabelEqnumber(text_org){
    const target = "\\ref";    
    let offset = 0;
    let i = text_org.indexOf(target, offset);
    if(i < 0) return text_org;
    let result="";
    while(i>= 0){
        let ib = text_org.indexOf("{", i + target.length);
        if(ib < 0) break;
        let ie = text_org.indexOf("}", ib + 1);
        if(ie < 0) break;

        const label = text_org.slice(ib+1, ie).trim();
        if(g_label_eqnumber.has(label)){
            const eqnumber = g_label_eqnumber.get(label);

            result += text_org.slice(offset, i) + eqnumber.toString();
        }else{
            result += text_org.slice(offset, i) + "??";
        }

        offset = ie + 1;
        i = text_org.indexOf(target, offset);
    }

    result += text_org.slice(offset);
    return result;
}

