"use strict";

//type//
const {electron,BrowserWindow,Menu, app, ipcMain,dialog, nativeImage,webContents} = require('electron');
const fs = require('fs');


let mainWindow = null;
let nowtype_icon;
let is_close_after_save = false;

const CreateWindow = () => {
    // mainWindowを作成（windowの大きさや、Kioskモードにするかどうかなどもここで定義できる）
    mainWindow = new BrowserWindow({width: 1024, height: 768, 
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: __dirname + '/ele.preload.js',
            spellcheck: true
        }            
    });
    

    mainWindow.on('closed', () =>{
        mainWindow = null;
    });

    mainWindow.on("close", (event)=>{        
        //if(document.title.indexOf('*')>=0)
        {
            const title = mainWindow.getTitle();
            if(title.indexOf('*')>=0){
                const res = dialog.showMessageBoxSync(mainWindow, 
                    {
                        type:"question",
                        buttons: ["Yes", "No", "Cancel"],
                        title: "Warning",
                        message: "Your text has been editted. Do you save it?",
                    }); 
                if(res===2){
                    event.preventDefault();
                }else if(res===0){                    
                    is_close_after_save=true;
                    SaveFile();
                    event.preventDefault();
                }
            }
        }
    });

    createMenu();

    mainWindow.webContents.once('did-finish-load',() =>{
        console.log("show");
        OpenInitialFile();
        InitializeZoom();
    });

    nowtype_icon = nativeImage.createFromPath(__dirname + '/icon.png')
    console.log(nowtype_icon);        
    

    mainWindow.loadURL('file://' + __dirname + '/ele.index.html');
    
}

app.on('ready', CreateWindow);

// 全てのウィンドウが閉じたら終了
app.on("window-all-closed", () => {
    if (process.platform != "darwin") {
        app.quit();
    }
});


//アクティブになったとき（MacだとDockがクリックされたとき）
app.on('activate', () => {
    if (mainWindow === null) {
        CreateWindow();        
    }
})

// メニューの作成
function createMenu() {
    const template = [        
        {
            label: 'File',
            submenu: [
                {
                    label: 'Open..',
                    accelerator: 'CmdOrCtrl+O', // ショートカットキーを設定
                    click: (menuItem, browserWindow, event) => { 
                        //if(! event.triggeredByAccelerator)
                        {
                            OpenFile(); 
                        }
                    }                        
                },
                {
                    label: 'Save..',
                    accelerator: 'CmdOrCtrl+S', //
                    click: (menuItem, browserWindow, event) => { 
                        //if(! event.triggeredByAccelerator)
                        {
                            SaveFile(); 
                        }
                    } // 
                },
                {
                    label: 'Save As..',
                    click: (menuItem, browserWindow, event) => { 
                        if(! event.triggeredByAccelerator){
                            SaveAs(); 
                        }
                    } // 
                },
                {type: 'separator'},
                {
                    label: 'Print ..',
                    click: (menuItem, browserWindow, event) => {
                        MenuPrint(browserWindow);
                    }
                },
                {
                    label: 'Print to PDF..',
                    click: (menuItem, browserWindow, event) => {
                        MenuPrintToPDF(browserWindow);
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                {
                    label: 'Undo..',
                    accelerator: 'CmdOrCtrl+Z', // ショートカットキーを設定
                    click: (menuItem, browserWindow, event) => { 
                        if(! event.triggeredByAccelerator){
                            MenuSimpleSend("undo");                             
                        }
                    }
                },
                {
                    label: 'Redo..',
                    accelerator: 'CmdOrCtrl+Shift+Z', //
                    click: (menuItem, browserWindow, event) => { 
                        if(! event.triggeredByAccelerator){
                            MenuSimpleSend("redo"); 
                        }
                    } // 
                },                
                {type: 'separator'},
                {
                    label: 'Cut..',
                    accelerator: 'CmdOrCtrl+X', //
                    click: (menuItem, browserWindow, event) => { 
                        if(! event.triggeredByAccelerator){
                            browserWindow.webContents.cut();  //sending cut command//
                        }
                    } // 
                },
                {
//                    role: "copy",
                    label: 'Copy..',                    
                    accelerator: 'CmdOrCtrl+C', //
                    click: (menuItem, browserWindow, event) => { 
                        if(! event.triggeredByAccelerator){
                            browserWindow.webContents.copy(); //sending copy command//
                        }
                    }
                },
                {
                    label: 'Paste..',
                    accelerator: 'CmdOrCtrl+V', //
                    click: (menuItem, browserWindow, event) => { 
                        if(! event.triggeredByAccelerator){
                            browserWindow.webContents.paste();  //sending paste command//
                        }
                    }
                },
                {type: 'separator'},
                {
                    label: 'Select All..',
                    accelerator: 'CmdOrCtrl+A', //
                    click: (menuItem, browserWindow, event) => { 
                        if(! event.triggeredByAccelerator){
                            MenuSimpleSend("selectall"); 
                        }
                    } // 
                },
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Zoom in..',
                    accelerator: 'CmdOrCtrl+PageUp',
                    click: (menuItem, browserWindow, event) => { 
                        MenuZoomin();                        
                    }
                },
                {
                    label: 'Zoom out..',
                    accelerator: 'CmdOrCtrl+PageDown',
                    click: (menuItem, browserWindow, event) => { 
                        MenuZoomout();           
                    }
                },
                {type: 'separator'},
                {
                    label: 'Math numbering',
                    type: 'checkbox',
                    checked: true,
                    click: (menuItem, browserWindow, event) => {                         
                        browserWindow.webContents.send("mathnumbering", {checked: menuItem.checked});
                    }

                },                
                {
                    label: 'Spellcheck',
                    type: 'checkbox',
                    checked: false,
                    click: (menuItem, browserWindow, event) => {                         
                        browserWindow.webContents.send("spellcheck", {checked: menuItem.checked});
                    }

                },
                {type: 'separator'},
                {
                    label: 'Change CSS style',
                    click: (menuItem, browserWindow, event) => { 
                        MenuSimpleSend("changecss");
                    }

                },
                {type: 'separator'},
                {
                    label: 'Show Markdown text',
                    click: (menuItem, browserWindow, event) => { 
                        MenuSimpleSend("showmarkdown");
                    }

                },
                {
                    label: 'Show HTML',                    
                    click: (menuItem, browserWindow, event) => { 
                        MenuSimpleSend("showhtml");
                    }

                }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Dev Tools..',
                    accelerator: 'F12', 
                    click: (menuItem, browserWindow, event) => { 
                        // ChromiumのDevツールを開く
                        console.log("dev tools");
                        mainWindow.webContents.openDevTools(); 
                    }
                },
                /*{
                    label: 'Test..',
                    accelerator: 'CmdOrCtrl+Q', 
                    click: (menuItem, browserWindow, event) => { 
                        // ChromiumのDevツールを開く
                        console.log("ctrl + q: triggeredByAccelerator", event.triggeredByAccelerator );

                    }
                },*/
                {
                    label: 'about',
                    click: (menuItem, browserWindow, event) =>{
                        dialog.showMessageBox(browserWindow, {
                            type: "info",
                            buttons: ["OK"],
                            title: "about NowType",
                            message: "NowType version " + app.getVersion(),
                            detail: "Copyright @ 2019-2020 Atsushi M. Ito",
                            icon: nowtype_icon
                        });
                    }
                }
            ]
        }
    ];
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu);
}


async function OpenFile() {
    console.log("before open file");
    
    // ファイル選択ダイアログを開く
    const result = await dialog.showOpenDialog(mainWindow, 
        {
            properties: ['openFile'],
            filters: [
                {
                    name: 'Markdown',
                    extensions: ['md']
                }
            ] 
        }  );
    if(!result.canceled){
        const filepath = result.filePaths[0];
        //console.log("filePath:", result, filepath);
        LoadFileAndSend(filepath)
    }
}

function LoadFileAndSend(filepath){
    console.log("open file:",filepath);
    
    fs.readFile(filepath, (error, data)=>{
        if(error){
            console.log("Error: invalid file open.");
            return;
        }

        // レンダラープロセスにイベントを飛ばす
        mainWindow.webContents.send("open_file", 
            {
                filepath: filepath,
                markdown: data.toString()
            }
        ); 
    });      
}

function SaveFile(){
    mainWindow.webContents.send("save_file");    
}

function SaveAs(){
    mainWindow.webContents.send("save_as");    
}

ipcMain.on("save_file_to_main", async (event, arg) => {
    console.log("save: path = ", arg.filepath); // prints "ping"
    console.log("markdown = ", arg.markdown.slice(0,10), " ... ", arg.markdown.slice(arg.markdown.length-10)); // prints "ping"

    if(fs.existsSync(arg.filepath)){
        console.log("save: onto the file existing");

        fs.writeFile(arg.filepath, arg.markdown, (error, data)=>{
            if(error){
                console.log("Error: invalid file open.");
                //return;
            }
            if(is_close_after_save){
                mainWindow.close();
            }
        });        
    }else{
        // ファイル選択ダイアログを開く
        const result = await dialog.showSaveDialog(mainWindow, 
            {
                filters: [
                    {
                        name: 'Markdown',
                        extensions: ['md']
                    }
                ]
            }  );
        if(!result.canceled){
            
            fs.writeFile(result.filePath , arg.markdown, (error, data)=>{
                if(error){
                    console.log("Error: invalid file open.");
                    //return;
                }
                if(is_close_after_save){
                    mainWindow.close();
                }
            });

            //rendererにファイル名を返す//
            mainWindow.webContents.send("file_path", 
                {
                    filepath: result.filePath
                }
            ); 
        }
    }
});

function OpenInitialFile(){
    //open file when the target file is indicated by argument //
    console.log(process.argv);
    //check is this start as electron or app//
    let file_i_arg = 1;
    const winexename = "\\electron.exe";
    if(process.argv[0].slice(process.argv[0].length - winexename.length)===winexename){
        file_i_arg = 2;
    }

    if(process.argv.length > file_i_arg){
        const filepath = process.argv[file_i_arg];
        console.log("argument file: ", filepath);
        if(fs.existsSync(filepath)){
            LoadFileAndSend(filepath);
        }
    }
}

function MenuSimpleSend(command){
    mainWindow.webContents.send(command);    
}


let zoom_css_key=null;
const zoom_list=["0.25", "0.333", "0.5", "0.667", "0.75", "1", "1.25", "1.333", "1.5", "1.75", "2.0", "3.0", "4.0"];
const zoom_level_init = 5;
let zoom_level = zoom_level_init;
function InitializeZoom(){    
    zoom_level = zoom_level_init;
    if(zoom_css_key){
        UpdateZoomCSS();
    }
}

function MenuZoomin(){
    
    if(zoom_level < zoom_list.length-1) zoom_level++;
    UpdateZoomCSS();
}

function MenuZoomout(){
    
    if(zoom_level >0 ) zoom_level--;
    UpdateZoomCSS();
}

async function UpdateZoomCSS(){
    const css_word = "div#paper{transform: scale(" + zoom_list[zoom_level] + ");}";
    const old_key = zoom_css_key;
    zoom_css_key = await mainWindow.webContents.insertCSS(css_word);
    if(old_key){
        await mainWindow.webContents.removeInsertedCSS(old_key);
    }
}

ipcMain.on("zoom", async (event, arg) => {
    if(arg > 0){
        if(zoom_level < zoom_list.length-1) zoom_level++;
    }else{
        if(zoom_level >0 ) zoom_level--;
    }
    UpdateZoomCSS();
});



async function MenuPrint(browserWindow){
        
    const wc = browserWindow.webContents;
    
    wc.print({margins:{marginType: "default"/*,marginsType: "custom",top: 0,bottom: 0,left: 0, right: 0*/}}, (success, error) => {
        if(success){
            console.log('Print successfully.');
        }else{
            console.log(error);
        }
    });
}


async function MenuPrintToPDF(browserWindow){
    const result = await dialog.showSaveDialog(browserWindow, 
        {
            filters: [
                {
                    name: 'PDF',
                    extensions: ['pdf']
                }
            ]
        }  );
    if(!result.canceled){
            
        const wc = browserWindow.webContents;
        
        wc.send("pdf_begin");    
        
        wc.printToPDF({pageSize:"A4", marginsType:0}).then(data => {
            fs.writeFile(result.filePath, data, (error) => {
            if (error) throw error;
            console.log('Write PDF successfully.');
            wc.send("pdf_end");
            })
        }).catch(error => {
            console.log(error);
            wc.send("pdf_end");
        });
    }

    
}


