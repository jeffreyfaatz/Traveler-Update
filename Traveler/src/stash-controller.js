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
exports.StashController = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/brace-style */
const fs = __importStar(require("fs"));
const config = __importStar(require("../config/config.json"));
const useful_data_1 = require("./useful-data");
const hideout_controller_1 = require("./hideout-controller");
const Get_Data = new useful_data_1.GetData();
const Hideout_Controller = new hideout_controller_1.HideoutController();
class StashController {
    setStashSize(profile, profileFolderPath, offraidPos) {
        const stashesOrderedBySize = Get_Data.getStashIDsBySize();
        const profileInventory = profile.characters.pmc.Inventory;
        const stashProfileInvenId = profileInventory.stash; //get stash inven _id from the profile Inventory.stash
        this.removeStashSizeBonusesFromProfile(profile);
        let stashItemId = this.getStashNameOrPathFromOffraidPos(offraidPos, profileFolderPath, "name");
        if (this.isStashUpgradable(stashItemId)) {
            const stashStationLevel = Hideout_Controller.getStashLevel(offraidPos, profileFolderPath);
            stashItemId = stashesOrderedBySize[stashStationLevel - 1] ?? stashesOrderedBySize[0];
        } // else do nothing because the stashItemId is already correct
        //set the stash _tpl
        if (!stashItemId) {
            return;
        }
        for (const item in profileInventory.items) {
            if (profileInventory.items[item]._id === stashProfileInvenId) {
                profileInventory.items[item]._tpl = stashItemId;
            }
        }
    }
    isStashUpgradable(stashItemId) {
        if (stashItemId === "TempStash_NoItemsSaved") {
            return false;
        }
        if (!config.stashes[stashItemId].upgradable) {
            return false;
        }
        return true;
    }
    removeStashSizeBonusesFromProfile(profile) {
        //this may be needed in profiles created prior to Traveler install
        for (let i = profile.characters.pmc.Bonuses.length; i > 0; i--) {
            if (profile.characters.pmc.Bonuses[i - 1].type === "StashSize") {
                profile.characters.pmc.Bonuses.splice(i - 1, 1);
            }
        }
    }
    checkForItemChildren(profileItems, _id) {
        const childrenItemsInStash = [];
        for (const item in profileItems) {
            const profItem_id = profileItems[item]?._id;
            if (profileItems[item].parentId === _id) {
                childrenItemsInStash.push(profItem_id);
                childrenItemsInStash.concat(this.checkForItemChildren(profileItems, profItem_id));
            }
        }
        return childrenItemsInStash;
    }
    loadStashFile(profileItems, offraidPos, profileFolderPath, dbItems, Item_Helper) {
        const stashFilePath = this.getStashNameOrPathFromOffraidPos(offraidPos, profileFolderPath, "path");
        //this array will contain the _id's of items with the "hideout" slotId, and any of their children
        let itemsInStash = [];
        //store _id's of items with "hideout" slotId and also all of their children
        for (const item in profileItems) {
            const profItem_id = profileItems[item]?._id;
            if (profileItems[item].slotId === "hideout") {
                //findAndReturnChildrenByItems also returns the item itself
                itemsInStash = itemsInStash.concat(Item_Helper.findAndReturnChildrenByItems(profileItems, profItem_id));
            }
        }
        //loop again to empty profile items with "hideout" slotId and any children of those items in prep to recieve new stash items
        for (let i = profileItems.length; i > 0; i--) {
            const profItem_tpl = profileItems[i - 1]?._tpl;
            const profItemId = profileItems[i - 1]._id; //this is the id for the item in the PROFILE not the item's actual _tpl id
            const isQuestItem = dbItems[profItem_tpl]?._props?.QuestItem;
            if (itemsInStash.includes(profItemId) && !isQuestItem) {
                profileItems.splice(i - 1, 1);
            }
        }
        //push stashFile items to profile
        if (stashFilePath !== "TempStash_NoItemsSaved") {
            const stashFile = JSON.parse(fs.readFileSync(stashFilePath, "utf8"));
            profileItems = profileItems.concat(stashFile.Items);
        }
        return profileItems;
    }
    saveToStashFile(profileItems, offraidPos, profileFolderPath, dbItems, Item_Helper) {
        const stashFilePath = this.getStashNameOrPathFromOffraidPos(offraidPos, profileFolderPath, "path");
        //this array will contain the _id's of items with the "hideout" slotId, and any of their children
        let itemsInStash = [];
        if (stashFilePath !== "TempStash_NoItemsSaved") {
            const tempItemsArr = [];
            const stashFile = JSON.parse(fs.readFileSync(stashFilePath, "utf8"));
            //store _id's to identify this item and its children (if any)
            for (const item in profileItems) {
                const profItem_id = profileItems[item]?._id;
                if (profileItems[item].slotId === "hideout") {
                    //findAndReturnChildrenByItems also returns the item itself
                    itemsInStash = itemsInStash.concat(Item_Helper.findAndReturnChildrenByItems(profileItems, profItem_id));
                }
            }
            //loop again to push stash items
            for (const item in profileItems) {
                const profItem_tpl = profileItems[item]?._tpl;
                const profItemId = profileItems[item]._id; //this is the id for the item in the PROFILE not the item's actual _tpl id
                const isQuestItem = dbItems[profItem_tpl]?._props?.QuestItem;
                if (itemsInStash.includes(profItemId) && !isQuestItem) {
                    tempItemsArr.push(profileItems[item]);
                }
            }
            //overwrite stash file items with tempItemsArr
            stashFile.Items = [...tempItemsArr];
            //write back to the stash file
            fs.writeFileSync(stashFilePath, JSON.stringify(stashFile, null, 4));
        }
    }
    getArrOfCustomStashesToPushToDb(dbItems, jsonUtil) {
        const tempStash = jsonUtil.clone(dbItems["5811ce772459770e9e5f9532"]);
        tempStash._name = "TempStash_NoItemsSaved";
        tempStash._id = "TempStash_NoItemsSaved";
        tempStash._props.Grids[0]._parent = "TempStash_NoItemsSaved";
        tempStash._props.Grids[0]._props.cellsH = 8;
        tempStash._props.Grids[0]._props.cellsV = 8;
        const configStashes = config.stashes;
        const stashesToPushToDB = [tempStash];
        for (const stashName in configStashes) {
            if (configStashes[stashName].size_h !== undefined) {
                const customStash = jsonUtil.clone(dbItems["5811ce772459770e9e5f9532"]);
                customStash._name = stashName;
                customStash._id = stashName;
                customStash._props.Grids[0]._parent = stashName;
                customStash._props.Grids[0]._props.cellsH = configStashes[stashName].size_h;
                customStash._props.Grids[0]._props.cellsV = configStashes[stashName].size_v;
                stashesToPushToDB.push(customStash);
            }
        }
        return stashesToPushToDB;
    }
    getStashNameOrPathFromOffraidPos(offraidPos, profileFolderPath, nameOrPath) {
        const stashes = config.stashes;
        let stashName = "TempStash_NoItemsSaved";
        //for each offraid pos, loop thru all stashes
        for (const st in stashes) {
            //for each stash, loop thru all of its access vias
            const accessVias = stashes[st].access_via;
            for (const acc in accessVias) {
                //if the access via === the current offraid pos, return the stash name
                if (accessVias[acc] === offraidPos) {
                    stashName = st;
                }
            }
        }
        const stashPath = `${profileFolderPath}/stashes/${stashName}.json`;
        if (nameOrPath === "name" || stashName === "TempStash_NoItemsSaved") {
            return stashName;
        }
        else if (nameOrPath === "path") {
            return stashPath;
        }
    }
    disableOORQuestStash(dbItems) {
        const outOfRaidQuestStash = dbItems["5963866b86f7747bfa1c4462"];
        const OORstashGrid = outOfRaidQuestStash._props.Grids[0]._props;
        OORstashGrid.cellsH = 8;
        OORstashGrid.cellsV = 0;
        OORstashGrid.filters = [
            {
                "Filter": [""],
                "ExcludedFilter": ["54009119af1c881c07000029"]
            }
        ];
        const inRaidQuestStash = dbItems["5963866286f7747bf429b572"];
        const IRstashGrid = inRaidQuestStash._props.Grids[0]._props;
        IRstashGrid.cellsV = 20;
    }
}
exports.StashController = StashController;
//# sourceMappingURL=stash-controller.js.map