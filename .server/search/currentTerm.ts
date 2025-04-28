import * as cheerio from 'cheerio';
import { GET } from './retryableSearch';

export default async function getCurrentTerm() {
    let resp = await GET("https://pisa.ucsc.edu/cs9/prd/sr9_2013/index.php");

    if (resp.status != 200) throw new Error("Could not get current term");

    let $ = cheerio.load(resp.data);
    let term = $("#term_dropdown option").attr('value') || "-1";

    if (term === "-1") throw new Error("Could not get current term; term not found in UI");

    // Summer Session is added to the calendar really early,
    // so it starts conflicting with Spring quarter enrollment.
    // Push it back to May!
    let isSummer = new Date().getMonth() > 4 || (new Date().getMonth() === 4 && new Date().getDate() > 15);
    if (term.endsWith("4") && isSummer) {
        return parseInt(term) - 2;
    }

    return parseInt(term);
}