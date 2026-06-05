import chalk from "chalk";

export function logInfo(message:string):void{
    console.log(chalk.cyan("[INFO]"),message)
}
export function logError(message:string):void{
    console.log(chalk.red("[ERROR]"),message)
}
export function logSuccess(message:string):void{
    console.log(chalk.green("[SUCCESS]"),message)
}
export function logWarning(message:string):void{
    console.log(chalk.yellow("[WARNING]"),message)
}
export function logHeader(message:string):void{
    console.log(chalk.magenta("\n"+message))
}