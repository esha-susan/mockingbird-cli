import chalk from "chalk"
import {ScanResult} from "../scanner/scanner"
import {Route} from "../extractor/extractor"
import {GenerationResult } from "../generator/generator"
import {WriteResult} from "../writer/writer"

export interface ReportData{
    scanResult:ScanResult;
    routes:Route[];
    generationResults:GenerationResult[];
    writeResults:WriteResult[];
    startTime:number;
    endTime:number;

}
export function printReport(data:ReportData):void{
    const{
        scanResult,
        routes,
        generationResults,
        writeResults,
        startTime,
        endTime
    }=data;

    const durationSeconds=((endTime-startTime)/1000).toFixed(2)
    const successfulGenerations=generationResults.filter(r=>r.success)
    const succcessfulWrites=writeResults.filter(w=>w.success)
    const totalLines=writeResults.reduce((sum,w)=>sum+w.linesWritten,0)

    const divider="=".repeat(45)

    console.log("\n"+chalk.bold.magenta(divider));
    console.log(chalk.bold.magenta("            MOCKINGBIRD GENERATION REPORT"))
    console.log(chalk.bold.magenta(divider)+"\m")
    
}