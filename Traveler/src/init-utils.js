"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitUtils = void 0;
const config = __importStar(require("../config/config.json"));
const exfilTooltips = __importStar(require("../config/exfil_tooltips.json"));
class InitUtils {
    changeExfilLocales(dbLocales) {
        const locales = dbLocales[`${config.locale_language}`];
        const exfilLocalesToChange = exfilTooltips.Extracts;
        for (const locName in exfilLocalesToChange) {
            if (exfilLocalesToChange[locName] !== "") {
                locales[locName] = exfilLocalesToChange[locName];
            }
        }
    }
    disableOutOfRaidQuestStashLocales(dbLocales) {
        const locales = dbLocales[`${config.locale_language}`];
        const stashLocalesToChange = exfilTooltips.OOR_Quest_Stash_Disable;
        for (const locKey in stashLocalesToChange) {
            if (stashLocalesToChange[locKey] !== "") {
                locales[locKey] = stashLocalesToChange[locKey];
            }
        }
    }
    changeTraderLocales(dbLocales) {
        const locales = dbLocales[config.locale_language];
        const configTraders = config.trader_config;
        for (const trName in configTraders) {
            const traderId = configTraders[trName].trader_id;
            const configTraderDesc = configTraders[trName].trader_description_text;
            const configTraderLoca = configTraders[trName].trader_location_text;
            if (configTraderDesc !== "") {
                locales[`${traderId} Description`] = configTraderDesc;
            }
            if (configTraderLoca !== "") {
                locales[`${traderId} Location`] = configTraderLoca;
            }
        }
    }
    setMedics(dbTraders) {
        const configTraders = config.trader_config;
        for (const trader in configTraders) {
            if (!config.post_raid_healing_enabled) {
                const traderId = configTraders[trader].trader_id;
                dbTraders[traderId].base.medic = false;
                continue;
            }
            if (configTraders[trader].is_medic) {
                const traderId = configTraders[trader].trader_id;
                dbTraders[traderId].base.medic = true;
            }
        }
    }
    noRunThrough(dbGlobals) {
        dbGlobals.config.exp.match_end.survived_exp_requirement = 0;
        dbGlobals.config.exp.match_end.survived_seconds_requirement = 0;
    }
    questFixes(dbQuests) {
        //change Dangerous Road quest to require an underpass extraction instead of streets car
        //tweak to the locale in the extraction_tooltips.json file
        // const dangerousRoadQuest = dbQuests["63ab180c87413d64ae0ac20a"]
        // dangerousRoadQuest.conditions.AvailableForFinish[0]._props.counter.conditions[2]._props["exitName"] = "E7"
    }
    removeStashSizeBonusesFromDB(dbHideoutAreas) {
        const stashStationTypeNumber = 3;
        for (const area in dbHideoutAreas) {
            if (dbHideoutAreas[area].type !== stashStationTypeNumber) {
                continue;
            }
            const stages = dbHideoutAreas[area].stages;
            for (const st in stages) {
                stages[st].bonuses = [];
            }
        }
    }
}
exports.InitUtils = InitUtils;
//# sourceMappingURL=init-utils.js.map