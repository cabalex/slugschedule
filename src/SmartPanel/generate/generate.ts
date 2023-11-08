interface Class {
    type: 'class'
    key: number
    value: string
}

interface GE {
    type: 'ge'
    key: number
    ge: string[]
    maxCredits: number
}

interface Random {
    type: 'random'
    key: number
    maxCredits: number
}

/**
 * 
 * @param classes - Array of classes (number) or requirements (object with arrays, such as {ge: ["PE-T"]})
 * @param noClassesBefore - No classes before this time of day (in miliseconds)
 * @param noClassesAfter - No classes after this time of day (in miliseconds)
 * @param classFreeDays - No classes on these days (e.g. ["Monday", "Friday"])
 * @returns Array of schedules (each schedule is an array of class numbers)
 */
export default function generateSmartSchedules(
    { classes, noClassesBefore, noClassesAfter, classFreeDays } :
    {
        classes?: Array<Class|GE|Random>,
        noClassesBefore?: number, // time
        noClassesAfter?: number, // time
        classFreeDays: string[] // day
    }
) : Array<number>[] {
    return [[11235]];   
}