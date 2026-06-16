import * as fs from "fs"
import {logError,logInfo,logWarning} from "../utils/logger"

export interface Route{
    method: string;
    path:string;
    handler:string;
    controllerFile:string;
}

export interface ExtractionResult{
    routes:Route[];
    totalFound:number;
    controllerFile:string;
}

const ROUTE_PATTERN=/(router|app)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*(?:\w+\s*,\s*)*(\w+)\s*\)/gi;

// Pure function — takes code as a string, returns routes
// No file system access — easy to test
export function parseRoutesFromCode(code: string, controllerFile: string = "unknown"): Route[] {
    const routes: Route[] = [];
    const matches = code.matchAll(ROUTE_PATTERN);
  
    for (const match of matches) {
      routes.push({
        method: match[2].toUpperCase(),
        path: match[3],
        handler: match[4],
        controllerFile
      });
    }
  
    return routes;
  }
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

    // Use the pure function for the actual parsing
  const routes = parseRoutesFromCode(fileContent, controllerFilePath);

  routes.forEach(route => {
    logInfo(`  ${route.method} ${route.path} → ${route.handler}`);
  });
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