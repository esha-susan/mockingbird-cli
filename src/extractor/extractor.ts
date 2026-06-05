import * as fs from "fs"
import {logError,logInfo,logWarning} from "../utils/logger"

export interface Route{
    method: string;
    path:string;
    handler:string;
    controllerFiles:string;
}

export interface ExtractionResult{
    routes:Route[];
    totalFound:number;
    controllerFile:string;
}

const ROUTE_PATTERN=/(router|app)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*(?:\w+\s*,\s*)*(\w+)\s*\)/gi;

export function extractRoutes(controllerFilePath:string):ExtractionResult{

    let fileContent:string

    try{
        fileContent=fs.readFileSync(controllerFilePath,"utf-8")
    }catch(error){
        logError(`Couldn't read file" ${controllerFilePath}`)
        return {
            routes:[],
            totalFound:0,
            controllerFile:controllerFilePath
        }
    }
    logInfo(`Extracting routes from ${controllerFilePath}`)

    const routes:Route[]=[];
    const matches=fileContent.matchAll(ROUTE_PATTERN)

    for(const match of matches){
        const route:Route={
            method:match[2].toUpperCase(),
            path:match[3],
            handler:match[4],
            controllerFiles:controllerFilePath
        }
        routes.push(route)
        logInfo(`   ${route.method} ${route.path} -> ${route.handler}`)
    }
    if (routes.length==0){
        logWarning(`  No routes found in: ${controllerFilePath}`);
    }
    return{
        routes,
        totalFound:routes.length,
        controllerFile:controllerFilePath
    }
}

export function extractAllRoutes(controllerFiles:string[]):Route[]{
    const allRoutes:Route[]=[];
    for (const filePath of controllerFiles){
        const result=extractRoutes(filePath);
        allRoutes.push(...result.routes)
    }
    return allRoutes
}