import * as approvedListsService from "../service/ApprovedListsService";
import {ApprovedListType, IApprovedListItemWrite} from "../objects/ApprovedLists";
import * as userService from "../../../api/users/services/userService";
import {IUserLoggedIn} from "../../services/services/users/contracts/IUser";

export async function seed() {
    const existing = await approvedListsService.read({type: ApprovedListType.MANAGER, searchableOnly: false, limit: 1});

    if (!existing || !existing.length) {
        console.log("Seeding managers");

        const toAdd: IApprovedListItemWrite[] = managers.map((m) => {
            return {
                value: m,
                type: ApprovedListType.MANAGER,
                searchable: true,
            } as IApprovedListItemWrite;
        });

        const systemUser: IUserLoggedIn = await userService.getSystemUserAsync();
        for (let i = 0; i < toAdd.length; i++) {
            try {
                await approvedListsService.create(systemUser, {ip: "127.0.0.1", user_agent: "server"}, toAdd[i]);
            } catch (err) {
                console.error(err);
            }
        }
    }
}

const managers: string[] = [
    "Abbey Residential",
    "Adellco",
    "Advenir",
    "AGPM",
    "Aimco",
    "Alliance Residential Company",
    "Allied Orion Group",
    "AMC",
    "American Campus Communities",
    "American Community Developers",
    "AMLI Residential",
    "Aragon Organization",
    "Aspen Square Management",
    "Asset Plus Communities",
    "Atlantic & Pacific Management",
    "Atlantic Realty Partners",
    "Atlas Residential",
    "AvalonBay",
    "Avenue5",
    "Avesta",
    "Bainbridge Property Management",
    "Balfour Beatty Communities",
    "Baron Properties",
    "Bassham Properties",
    "Beachwold Residential",
    "Beacon Communities",
    "Bell Partners",
    "Berkshire Communities",
    "BH Management",
    "Bozzuto",
    "Bridge Property Management",
    "Brunetti Organization",
    "Camden Property Trust",
    "Capstone Real Estate Services",
    "Carroll Management Group",
    "Case and Associates",
    "CED Capital Holdings",
    "CF Real Estate",
    "CIM Group",
    "Cirrus Asset Management",
    "CLK Properties",
    "ConAm",
    "Connor Group",
    "Continental Properties",
    "Cornerstone Group",
    "Cortland Partners",
    "Cottonwood Residential",
    "Crescent Heights of America",
    "CWS Capital Partners",
    "Davis Development",
    "Dolben Company",
    "Dominium",
    "Easlan Capital",
    "Ed Ad National Properties",
    "Edgewood Management ",
    "Edward Rose",
    "EMD Properties",
    "Epoch Properties",
    "Equity Residential",
    "Essex Property Trust",
    "Excelisor Group",
    "Fairfield Residential Company",
    "Federal Capital Partners",
    "Finger Companies",
    "First Communities",
    "Forest City",
    "FPA Management",
    "FPI Management",
    "G & M Realty",
    "Gables Residential",
    "Garden Communities ",
    "Gates Hudson",
    "GHC Housing Partners",
    "GID",
    "GoldOller",
    "Goldrich and Kest",
    "Greystar",
    "Hamilton Zanze & Company",
    "Hanover Company",
    "Harbor Group International",
    "Hawthorne Residential Partners",
    "Herman & Kittle Properties",
    "Highland Capital Management",
    "Holland Partner Group",
    "HSL Properties",
    "Hunt/LEDIC Realty Company Associates",
    "IMT Residential",
    "Independence Realty Trust (IRT)",
    "Inland Group",
    "Internacional Realty",
    "Irvine Company",
    "Jackson Square Properties",
    "JBG Companies",
    "Jefferson Apartment Group",
    "JK Residential",
    "JMG Realty",
    "John Stewart Company",
    "Kamson Corporation",
    "Kay Apartment Communities",
    "Kennedy Wilson",
    "Kettler and Kettler Management",
    "Knightvest Capital",
    "Korman Communities",
    "Laramar Communities",
    "LBK Management Services",
    "LCOR",
    "Ledic Realty Company",
    "LeFrak Organization",
    "LEM Capital",
    "Lennar Multifamily Communities (LMC)",
    "Lerner Enterprises",
    "Lewis Group",
    "Lightstone Group",
    "Lincoln Property Company ",
    "Lindsey Management Company",
    "LivCor",
    "LumaCorp",
    "Lynd Company",
    "Lyon Living",
    "MAA",
    "Madrona Ridge Residential",
    "Management Support",
    "Mark-Taylor",
    "Marquette Company",
    "Martin Fein Interests",
    "Matrix Residential",
    "Maxus Realty Trust",
    "Maxx Properties",
    "MBK Real Estate",
    "MC Companies",
    "McCormack Baron Management",
    "McDowell Properties",
    "McKinley Properties",
    "MEB ",
    "MG Properties",
    "Michaels Organization",
    "Middleburg Management",
    "Milestone Management",
    "Mill Creek Residential",
    "Millennia Housing Companies",
    "Mission Rock Residential",
    "Monarch Investment & Management",
    "Morgan Properties",
    "NALS Apartment Homes",
    "Nitya Capital",
    "Northland Investment Corporation",
    "Oak Realty Group",
    "Olen Properties",
    "Olympus Properties",
    "Omni Group of Companies",
    "Omninet Capital",
    "Pantzer Properties",
    "PASSCO Real Estate",
    "PB Bell",
    "Peak Campus",
    "Peak Living",
    "Pedcor Companies",
    "Pegasus",
    "PEM ",
    "Pensam Residential",
    "Picerne Real Estate Group",
    "Pillar Communities",
    "Pillar Income Asset Management",
    "Pinnacle",
    "Preferred Apartment Communities",
    "Preiss Company",
    "Presidium Group",
    "Price Brothers",
    "Priderock Capital Partners",
    "Prime Residential",
    "Princeton Enterprises",
    "Prometheus Real Estate Group",
    "Pure Apartments",
    "R & V Management ",
    "RAIT Commerical",
    "RAM Partners",
    "Randall Group",
    "Related Companies",
    "Resource Real Estate",
    "Richdale Apartments",
    "Richman Group",
    "Rincon Partners",
    "RK Properties",
    "Robbins Electra",
    "ROCO Real Estate",
    "Roscoe",
    "Roseland Property",
    "Sares-Regis",
    "Scion Group",
    "Sentinel Real Estate",
    "Sequoia Equities",
    "Shea Properties",
    "Shelton-Cook",
    "SIMC Property Management Group",
    "Simpson Housing",
    "Solomon Organization",
    "Southern Management Corporation",
    "Southwood Realty",
    "Starlight Investments",
    "Steadfast Companies",
    "SynerMark Properties",
    "The Dinerstein Companies (TDC)",
    "Thrive Communities",
    "Timberland Partners",
    "Tribridge Residential",
    "Trilogy Real Estate Group",
    "Trion Properties",
    "TruAmerica Multifamily",
    "UDR",
    "United Apartment Group",
    "University Partners",
    "US Residential",
    "USA Property Fund",
    "Venterra Realty",
    "Village Green",
    "Wasatch Premiere Communities",
    "Waterton Residential",
    "Waypoint Residential",
    "Weidner Apartment Homes",
    "Weinstein Properties",
    "Westdale Real Estate",
    "Western National Group",
    "Westover Companies",
    "Westwood Residential",
    "Winn Companies",
    "Wood Partners",
    "Wood Residential Services",
    "Woodmont Residential Services",
    "Worthington Companies",
    "ZRS Management",
];
