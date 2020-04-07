const{app, BrowserWindow, ipcMain, dialog} = require('electron');
const logger = require("electron-log");
const qrcode = require('qrcode');
const path = require("path");
const fs = require("fs");

let mainWindow;

function createWindow(){
    mainWindow = new BrowserWindow({
        title: 'QRCode Generator',
        width: 670,
        height: 380,
        resizable: false,
        webPreferences: {
            nodeIntegration: false,
            preload: path.join(__dirname, "preload.js")
        }
    });


    // mainWindow.loadURL(`file://${__dirname}/static/index.html`);
    mainWindow.loadFile(path.join(__dirname, "static/index.html"));
    mainWindow.on('closed', () =>{
        logger.info("--- Main Window is on closed ---");
        mainWindow = null;
    });
    mainWindow.openDevTools();
    mainWindow.removeMenu();

    ipcMainEventHandler(mainWindow);

}

app.on('ready', () =>{
    logger.info("--- application is on ready ---");
    createWindow();
});

app.allowRendererProcessReuse = true;





function ipcMainEventHandler(mainWindow){
    var qrGenerateOption = {
        errorCorrectionLevel: 'L',
        type: 'image/png',
        scale: 19,
        margin: 5
    }

    var qrSaveDialogOption = {
        title: "Save Qr Image",
        filters: [{name: "이미지 형식", extensions: ['png']}]
    }
    
    var qrSaveSuccessDialogOption = {
        type: "info",
        message: "파일저장에 성공하였습니다."
    }

    var qrSaveErrorDialogOption = {
        type: "error",
        message: "파일저장에 실패하였습니다."
    }

    /*---------- 이미지 생성후 preview로 전달 ----------*/
    ipcMain.on('QRCodeCh',(event, arg) => {
        logger.log("Target Text : " + arg);
        qrcode.toDataURL(arg, qrGenerateOption, function(err, arg){
            event.sender.send("QRCodeCh", arg);
        });
    });

    /*---------- QR코드 이미지 저장 ----------*/
    ipcMain.on('QRCodeSaveCh', (event, arg) => {
        logger.log("Save QR Image : " + arg);
        var saveFileName = arg + ".png";
        qrSaveDialogOption.defaultPath = saveFileName;
        var path = dialog.showSaveDialogSync(mainWindow, qrSaveDialogOption);
        if(path != undefined){
            logger.log("Image save SUCCESS! : " + path);
            qrcode.toFile(path, saveFileName, qrGenerateOption, function(err){
                if(err){
                    logger.error(err);
                    dialog.showMessageBoxSync(mainWindow);
                    throw err;
                }
                var dialogStatus = dialog.showMessageBoxSync(mainWindow, qrSaveErrorDialogOption);
                //logger.log(dialogStatus);
            });
        }
    });

}