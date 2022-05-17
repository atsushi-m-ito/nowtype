"use strict";

//type//
const {BrowserWindow,Menu, MenuItem, app, ipcMain,dialog, nativeImage,shell} = require('electron');
const fs = require('fs');


let mainWindow = null;
let nowtype_icon;
let is_close_after_save = false;

let context_menu = null;

let nt_file_status = {is_updated: false};

const user_setting_path = app.getPath("userData") + "/user.setting.json";
let file_history = [];
let lost_file_history = [];
let current_file_path = null;

const CreateWindow = () => {
    const setting = ReadJSON(user_setting_path);
    let width = 1024;
    if(setting.window){
        if(setting.window.width){
            if(setting.window.width >= 400){
               width = setting.window.width; 
            }
        }
    }
    let height = 768;
    if(setting.window){
        if(setting.window.height){
            if(setting.window.height >= 320){
                height = setting.window.height; 
            }
        }
    }

    mainWindow = new BrowserWindow({
        width: width,
        height: height, 
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: __dirname + '/ele.preload.js',
            spellcheck: true
        }            
    });
    if(setting.window){ if(setting.window.startWithMaximized) mainWindow.maximize();}
    mainWindow.show();
    

    mainWindow.on('closed', () =>{
        mainWindow = null;
    });

    /*
    Important note: 
    The callback function of "close" event should not be async function 
    because an async function cannot stop to close of windows.
    That is, window will be closed before perform preventDefault().
    */
    mainWindow.on("close", (event)=>{
        console.log("catch close");
        if(IsFileUpdated()){            
            event.preventDefault();

            //cannot use await because this function is not in async function//
            asyncSaveOrNot().then((result)=>{
                if(result==true){
                    nt_file_status.is_updated = false;
                    mainWindow.close(); //recall//
                }
            });            
            return;
        }
        
        console.log("pass checking file save");

        console.log("save setting");
        SaveSetting();

        console.log("end of close event");
    });

    CreateMenu();
    MenuByFileHistory(setting);//add recent file history//
    
    context_menu = CreateContextMenu();

    mainWindow.webContents.once('did-finish-load',() =>{
        console.log("loaded");
        InitializeZoom();
        console.log("zoom");        
        OpenInitialFile();
    });
    console.log("initialize 1");  

    nowtype_icon = nativeImage.createFromPath(__dirname + '/icon.png')
    //console.log(nowtype_icon);        
    
    mainWindow.loadURL('file://' + __dirname + '/ele.index.html');
    console.log("initialize 2");  

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


function IsFileUpdated(){
    return nt_file_status.is_updated;
}

/*
The return value is true if the user select "Yes" and the file is successfully saved or the user select "No" to advance without saving file,
while the return value is false if the user select "Yes" and but the file is not saved or the user select "cancel".
*/
async function asyncSaveOrNot(){

    const res = dialog.showMessageBoxSync(mainWindow, 
        {
            type:"question",
            buttons: ["Yes", "No", "Cancel"],
            title: "Warning",
            message: "Your text has been editted. Do you save it?",
        }); 
    if(res==2){
        console.log("User selects CANCEL.");
        return false;
    }else if(res==0){                    
        
        
        console.log("call asyncSaveFile");            
        const res2 = await asyncSaveFile();
        if(res2==true){
            console.log("User selects YES and the file is saved.");
            return true;
        }
        console.log("User selects YES and but the file is not saved.");
        return false;
        
    }else{ //without save//
        console.log("User selects NO to advance without saving.");
        return true;
        
    }

}


// create menu //
function CreateMenu() {
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
                            asyncOpenFile();
                        }
                    }                        
                },
                {
                    label: 'Save..',
                    accelerator: 'CmdOrCtrl+S', //
                    click: (menuItem, browserWindow, event) => { 
                        //if(! event.triggeredByAccelerator)
                        {
                            asyncSaveFile(); 
                        }
                    } // 
                },
                {
                    label: 'Save As..',
                    click: (menuItem, browserWindow, event) => { 
                        if(! event.triggeredByAccelerator){
                            asyncSaveAs("md"); 
                        }
                    } // 
                },
                {type: 'separator'},
                {
                    label: 'Recent Files..',
                    id: "MenuID_FileHistory",
                    submenu: []
                },
                {type: 'separator'},
                {
                    label: 'Show in folder',
                    click: (menuItem, browserWindow, event) => { 
                        if(! event.triggeredByAccelerator){
                            if(current_file_path){
                                shell.showItemInFolder(current_file_path);
                            }
                        }
                    } // 
                },
                {type: 'separator'},
                {
                    label: 'Print ..',
                    click: (menuItem, browserWindow, event) => {
                        MenuPrint(browserWindow, "printer");
                    }
                },
                {
                    label: 'Print to PDF..',
                    click: (menuItem, browserWindow, event) => {
                        MenuPrint(browserWindow,"pdf");
                    }
                },
                {type: 'separator'},
                {
                    label: 'Export HTML',
                    enabled: false/*,
                    click: (menuItem, browserWindow, event) => {
                        if(! event.triggeredByAccelerator){
                            asyncSaveAs("html"); 
                        }
                    }*/
                },
                {
                    label: 'Export LaTex',
                    click: (menuItem, browserWindow, event) => {
                        if(! event.triggeredByAccelerator){
                            asyncSaveAs("tex"); 
                        }
                    }
                },
                {type: 'separator'},
                {
                    label: 'Quit',
                    role: 'quit'
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
                        //if(! event.triggeredByAccelerator)
                        {
                            browserWindow.webContents.cut();  //sending cut command//
                        }
                    } // 
                },
                {
//                    role: "copy",
                    label: 'Copy..',                    
                    accelerator: 'CmdOrCtrl+C', //
                    click: (menuItem, browserWindow, event) => { 
                        //if(! event.triggeredByAccelerator)
                        {
                            browserWindow.webContents.copy(); //sending copy command//
                        }
                    }
                },
                {
                    label: 'Paste..',
                    accelerator: 'CmdOrCtrl+V', //
                    click: (menuItem, browserWindow, event) => { 
                        //if(! event.triggeredByAccelerator)
                        {
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
                {type: 'separator'},
                {
                    label: 'Find..',
                    accelerator: 'CmdOrCtrl+F', //
                    click: (menuItem, browserWindow, event) => { 
                        MenuSimpleSend("find");                         
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
                    label: 'Math refresh',
                    type: 'checkbox',
                    checked: true,
                    accelerator: 'F5',
                    click: (menuItem, browserWindow, event) => {                         
                        browserWindow.webContents.send("mathrefresh");                        
                    }

                },
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
                },
                {
                    label: 'Show TeX',
                    click: (menuItem, browserWindow, event) => { 
                        MenuSimpleSend("showtex");
                    }
                }
            ]
        },
        {
            label: 'Help',
            submenu: [
                
                {type: 'separator'},
                {
                    label: 'Dev Tools..',
                    accelerator: 'F12', 
                    click: (menuItem, browserWindow, event) => { 
                        // ChromiumのDevツールを開く
                        console.log("dev tools");
                        mainWindow.webContents.openDevTools(); 
                    }
                },
                {
                    label: 'appData',
                    click: (menuItem, browserWindow, event) =>{
                        dialog.showMessageBox(browserWindow, {
                            type: "info",
                            buttons: ["OK"],
                            title: "appData: data stored directory",
                            message: "List of app.GetPath()",
                            detail: "home: " + app.getPath("home") + "\n"
                                 + "appData: " + app.getPath("appData") + "\n"
                                 + "userData: " + app.getPath("userData") + "\n"
                                 + "cache: " + app.getPath("cache") + "\n"
                                 + "temp: " + app.getPath("temp") + "\n"
                                 + "exe: " + app.getPath("exe") + "\n"
                                 + "module: " + app.getPath("module") + "\n"
                                 + "desktop: " + app.getPath("desktop") + "\n"
                                 + "documents: " + app.getPath("documents") + "\n"
                                 + "downloads: " + app.getPath("downloads") + "\n"
                                 + "music: " + app.getPath("music") + "\n"
                                 + "pictures: " + app.getPath("pictures") + "\n"
                                 + "videos: " + app.getPath("videos") + "\n"
                                 + "logs: " + app.getPath("logs") + "\n",
                            icon: nowtype_icon
                        });
                    }
                },
                {type: 'separator'},                
                {
                    label: 'Open setting (JSON)',
                    click: (menuItem, browserWindow, event) =>{
                        shell.openPath(user_setting_path);
                        //shell.openPath(user_setting_path); //this will be used from electron v9//
                    }
                },
                {type: 'separator'},                
                {
                    label: 'web site',
                    click: (menuItem, browserWindow, event) =>{
                        shell.openExternal('https://atsushi-m-ito.github.io/nowtype/');
                    }
                },
                {
                    label: 'about',
                    click: (menuItem, browserWindow, event) =>{
                        dialog.showMessageBox(browserWindow, {
                            type: "info",
                            buttons: ["OK"],
                            title: "about NowType",
                            message: "NowType version " + app.getVersion(),
                            detail: "Copyright @ 2019-2022 Atsushi M. Ito",
                            icon: nowtype_icon
                        });
                    }
                }
            ]
        }
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}


// menu for right click //
function CreateContextMenu() {
    const template = [
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
            ];
    return Menu.buildFromTemplate(template);
}



// menu of recent files //
function MenuByFileHistory(setting) {
    
    if(!setting.fileHistory) {
        console.log("fileHistory is not found in", user_setting_path);
        return null;
    }
    if(setting.fileHistory.length == 0){
        console.log("fileHistory is empty in", user_setting_path);  
        return null;
    }
                
    
    const main_menu = Menu.getApplicationMenu();
    const menu_hist = main_menu.getMenuItemById("MenuID_FileHistory");
    
    for(let i = 0; i < setting.fileHistory.length; ++i){
        const path = setting.fileHistory[i];
        console.log("recent file:", path);
        menu_hist.submenu.insert(0, new MenuItem({
            label: path,
            click: OnMenuRecentFile
        }));
    }
    
}



ipcMain.on("open_file_to_main",(event, arg) => {
    asyncOpenFile( arg.filepath );
});

async function OnMenuRecentFile(menuItem, browserWindow, event){
    return asyncOpenFile(menuItem.label);
}


async function asyncOpenFile(filepath = null) {
    console.log("before open file");
    
    if(IsFileUpdated()){
        const res = await asyncSaveOrNot();
        if(res!=true){
            return;
        }           
    }

    if(filepath==null){
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
            filepath = result.filePaths[0];        
        }else{
            return;
        }
    }else if(!fs.existsSync(filepath)){
        dialog.showMessageBoxSync(mainWindow, 
            {
                type:"info",
                buttons: ["OK"],
                title: "File is not found",
                message: "The file does not already exist.",
            }); 
        
        lost_file_history.push(filepath);
        UpdateFileHistory(file_history, filepath, false);
        return;
    }

    LoadFileAndSend(filepath);    
}

function LoadFileAndSend(filepath){
    console.log("open file:",filepath);
    
    fs.readFile(filepath, (error, data)=>{
        if(error){
            console.log("Error: invalid file open.");
            return;
        }

        mainWindow.webContents.send("open_success", 
            {
                filepath: filepath,
                markdown: data.toString()
            }
        ); 

        nt_file_status.is_updated = false;
        UpdateFileHistory(file_history, filepath);

    });      
}

function UpdateFileHistory(file_history, new_data, do_apend = true){
    const index = file_history.indexOf(new_data);
    if(index>=0){
        file_history.splice(index,1);
    }
    if(do_apend){
        file_history.push(new_data);
        current_file_path = new_data;
    }
}


async function asyncSaveFile(){
    mainWindow.webContents.send("save_file");
    //will catch save_file_to_main message//
    return asyncSaveFile2();
}

async function asyncSaveFile2(){
    console.log("begin of asyncSaveFile2");

    const arg1 = await new Promise((resolve, reject)=>{
        ipcMain.once("save_file_to_main", (event, arg) => {
            console.log("save: path = ", arg.filepath); // prints "ping"
            console.log("data = ", arg.markdown.slice(0,10), " ... ", arg.markdown.slice(arg.markdown.length-10)); // prints "ping"
            resolve(arg);
        });
    });
    
    const res = await asyncSaveFile3(arg1.filepath, arg1.markdown, arg1.extension);    

    console.log("end of asyncSaveFile2");
    return res;
}

async function asyncSaveAs(extension){
    mainWindow.webContents.send("save_as", extension);
    //will catch save_file_to_main message//
    await asyncSaveFile2();
}

async function asyncSaveFile3(filepath, textdata, extension){
    if(!fs.existsSync(filepath)){
        // file is not exist, and then waiting input by user//
        const result = await dialog.showSaveDialog(mainWindow, 
            {
                filters: [
                    (extension == 'md') ? 
                    {
                        name: 'Markdown',
                        extensions: ['md']
                    }
                    : (extension == 'tex') ? 
                    {
                        name: 'TeX',
                        extensions: ['tex']
                    }
                    : (extension == 'html') ? 
                    {
                        name: 'HTML',
                        extensions: ['html']
                    }: {
                        name: 'Markdown',
                        extensions: ['md']
                    },                 
                    {
                        name: 'All files',
                        extensions: ['*']
                    }
                ]
            }  );

        if(result.canceled){
            console.log("save: cancel");
            return false;            
        }

        filepath = result.filePath;
    }
    
    console.log("save: onto the file existing");


    const res = await new Promise((resolve, reject)=>{
        fs.writeFile(filepath , textdata, (error)=>{
            if(error){
                console.log("Error: invalid file open.");
                reject(false);
            }
            resolve(true);
        });
    });

    
    if(res==true){
        if(extension == "md"){
            nt_file_status.is_updated = false;
            UpdateFileHistory(file_history, filepath);
        }
        
        //rendererにファイル名を返す//
        mainWindow.webContents.send("save_success",
            {
                filepath: filepath,
                extension: extension
            }
        );

        console.log("actualy saved", filepath);

        if(is_close_after_save){
            mainWindow.close();
        }
        return true;
    }

    return false;

}


function OpenInitialFile(){
    //open file when the target file is indicated by argument //
    console.log(process.argv);
    //check is this start as electron or app//
    let file_i_arg = 1;
    const winexename = "\\electron.exe";
    if(process.argv[0].slice(process.argv[0].length - winexename.length) == winexename){
        file_i_arg = 2;
    }

    if(process.argv.length > file_i_arg){
        const path = require('path');
        const filepath = path.resolve(process.argv[file_i_arg]);
        //const filepath = path.resolve(process.argv[file_i_arg];
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
        asyncUpdateZoomCSS();
    }
}

function MenuZoomin(){
    
    if(zoom_level < zoom_list.length-1) zoom_level++;
    asyncUpdateZoomCSS();
}

function MenuZoomout(){
    
    if(zoom_level >0 ) zoom_level--;
    asyncUpdateZoomCSS();
}

async function asyncUpdateZoomCSS(){
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
    asyncUpdateZoomCSS();
});



const ChangeExt = (filepath, new_ext)=>{
    if(filepath===null) return "";
    const pos1 = filepath.lastIndexOf(".");
    if(pos1===-1){
        return filepath + "." + new_ext;
    }else{
        return filepath.slice(0, pos1+1) + new_ext;
    }
};

function MenuPrint(browserWindow, device){
    
    const wc = browserWindow.webContents;
    wc.send("print_begin", device);
}


ipcMain.on("print_ready", async (event, device) => {
    if(device=="printer"){
        const wc = mainWindow.webContents;
        wc.print({margins:{marginType: "default"/*,marginsType: "custom",top: 0,bottom: 0,left: 0, right: 0*/}}, (success, error) => {
            if(success){
                console.log('Print successfully.');
            }else{
                console.log(error);
            }
            
            wc.send("print_end");
        });
    }else if(device=="pdf"){
        const wc = mainWindow.webContents;
        const result = await dialog.showSaveDialog(mainWindow, 
            {
                filters: [
                    { name: 'PDF', extensions: ['pdf']},
                    { name: 'All files', extensions: ['*']}
                ],
                defaultPath: ChangeExt(current_file_path, "pdf")
            }  );
        if(result.canceled){
            wc.send("print_end");
        }else{
            wc.printToPDF({pageSize:"A4", marginsType:0}).then(data => {
                fs.writeFile(result.filePath, data, (error) => {
                if (error) throw error;
                console.log('Write PDF successfully.');                
                wc.send("print_end");
                })
            }).catch(error => {
                console.log(error);
                wc.send("print_end");
            });  
        }            

    }
});



ipcMain.on("showcontextmenu", (event)=>{
    context_menu.popup();
});


const ReadJSON = (filepath) =>{
    
    console.log("open setting:", filepath);
    if(fs.existsSync(filepath)){
        console.log("exists");
        const data = fs.readFileSync(filepath);
        if(data){
            return JSON.parse(data);
        }               
    }
    return {};
}




const SaveSetting = () =>{
    const setting = ReadJSON(user_setting_path);
        
    //windows size//
    if((!mainWindow.isMaximized()) && (!mainWindow.isMinimized())){
        const [width,height] = mainWindow.getSize();
        setting.window = {width: width, height: height};
    }
    
    setting.window.startWithMaximized = mainWindow.isMaximized() ? true : false;
    

    if(setting.fileHistory){
        lost_file_history.forEach((path)=>{
            const index = setting.fileHistory.indexOf(path);
            if(index>=0){
                setting.fileHistory.splice(index,1);
            }      
        });

        while(file_history.length > 0){
            const path = file_history.shift();
            UpdateFileHistory(setting.fileHistory, path);            
        }
    }else{
        setting.fileHistory = file_history;
    }
    //shrink length of file history//
    let file_history_limit = 20;
    if(setting.fileHistoryLimit){
        if(Number.isInteger(setting.fileHistoryLimit) ){
            file_history_limit = Number(setting.fileHistoryLimit);
        }
    }
    setting.fileHistoryLimit = file_history_limit;
    if(setting.fileHistory.length > file_history_limit){
        setting.fileHistory = setting.fileHistory.slice(setting.fileHistory.length-file_history_limit);
    }
    
    fs.writeFileSync(user_setting_path , JSON.stringify(setting, null, "  "));
    
}


ipcMain.on("file_updated", async (event, arg) => {
    nt_file_status.is_updated = arg;
});

