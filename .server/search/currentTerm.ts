import * as cheerio from 'cheerio';
import { GET } from './retryableSearch';

export default async function getCurrentTerm() {
    let resp = await GET("https://pisa.ucsc.edu/cs9/prd/sr9_2013/index.php");

    if (resp.status != 200) throw new Error("Could not get current term");

    let $ = cheerio.load(resp.data);
    let term = $("#term_dropdown option").attr('value') || "-1";

    if (term === "-1") throw new Error("Could not get current term; term not found in UI");

    return parseInt(term);
}