"use strict";

function NT_MathNumbering(checked) {
    if(nt_render_div===null) return;
    console.log("mathnumbering = ", checked);
    const render_div = nt_render_div;
    const fragment = FragmentFromChildren(render_div);
    InitializeMathInFragment(fragment, checked ? 1 : 0);
    render_div.appendChild(fragment);
}

function InitializeMathInFragment(fragment, number){
    
    let matches = fragment.querySelectorAll('span.math');
    
    for (let i=0; i<matches.length; i++) {
        const math = matches[i];
        const margin = GetEditMargin(math);
        let text_node = math.lastChild.firstChild;
        let mathtext = text_node.data.substring( margin  , text_node.length - margin);

        switch(math.lastChild.className){
        case "editmath":
            {
                const delta = MathRendering(math, mathtext, number);
                number += delta;                
                ShowPreview(math.firstChild);
            }
            break;
        case "editmathdisp":
            {
                const delta = MathRendering(math, mathtext, number);
                number += delta;
                ShowPreviewDisplay(math.firstChild);                
            }
            break;
        case "editcode":
            {
                math.firstChild.textContent = mathtext;
                ShowPreview(math.firstChild);        
            }
            break;
        case "editcodedisp":
            {
                if(mathtext.charAt(0)==='\n'){
                    math.firstChild.textContent = mathtext.slice(1,mathtext.length - 1);
                }else{
                    math.firstChild.textContent = mathtext;
                }
                ShowPreviewDisplay(math.firstChild);    
            }
            break;
        case "editimg":
            {
                let pos_split_a_img = mathtext.indexOf("](");
                if(pos_split_a_img < 0){
                    math.firstChild.alt = mathtext;
                    math.firstChild.src = null;
                }            
                
                math.firstChild.src = nt_file_dir + mathtext.slice(pos_split_a_img + 2, mathtext.length+1);
                math.firstChild.alt = mathtext.slice(0,pos_split_a_img);
                ShowPreview(math.firstChild);
            }
            break;
        }
        SetHide(math.lastChild);
    }    
}
