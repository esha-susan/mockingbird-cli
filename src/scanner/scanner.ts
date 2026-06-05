import * as fs from "fs"
import * as path from "path"
import {logInfo,logWarning,logSuccess, logError} from "../utils/logger";
import { log } from "console";

export interface ScanResult{
    controllerFiles:string[];
    totalFound:number;
    scannedDirectory:string;
}

const CONTROLLER_PATTERNS: string[]=[
    "controller.ts",
    "Controller.ts",
    "router.ts",
    "Router.ts",
    "routes.ts",
    "Routes.ts"
]
const IGNORED_DIRECTORIES:string[]=[
    "node_modules",
    "dist",
    ".git",
    "coverage",
    "build"
]

export function scanProject(projectPath:string): ScanResult{

    const absolutePath=path.resolve(projectPath)

    if(!fs.existsSync(absolutePath)){
        logWarning(`Directory not found: ${absolutePath}`);
        return{
            controllerFiles:[],
            totalFound:0,
            scannedDirectory:absolutePath
        }
    }

    logInfo(`Scanning project at ${absolutePath}`)

    const controllerFiles:string[]=[];

    walkDirectory(absolutePath,controllerFiles);

    logSuccess(`Found ${controllerFiles.length} controller file(s)`)

    return{
        controllerFiles,
        totalFound:controllerFiles.length,
        scannedDirectory:absolutePath
    }
}

function walkDirectory(currentPath:string,results:string[]):void{
    let entries:fs.Dirent[]

    try{
        entries=fs.readdirSync(currentPath,{withFileTypes:true})
    }catch(error){
        logError(`Couldn't read directory: ${currentPath}`)
        return;
    }

    for(const entry of entries){
        const fullPath=path.join(currentPath,entry.name);

        if (entry.isDirectory()){
            if (IGNORED_DIRECTORIES.includes(entry.name)){
                continue;
            }
            walkDirectory(fullPath,results);
        }
        else if(entry.isFile()){
            if (isControllerFile(entry.name)){
            results.push(fullPath);
            logInfo(` Found:${entry.name}`);
        }
    }
}
}
function isControllerFile(fileName:string):boolean{
    return CONTROLLER_PATTERNS.some(pattern=>
        fileName.toLowerCase().endsWith(pattern.toLocaleLowerCase())
    )
}