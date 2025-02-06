import InitiativeCreature, { Attitude } from "./InitiativeCreature";
import InitiativeOrder from "./InitiativeOrder";
import MonsterDropdown from "./MonsterDropdown";
import { evaluate as mathEval, floor as mathFloor } from 'mathjs';

type InitiativeTableColumn = {
    header : string,
    id : string,
    create: (c: InitiativeCreature)=>HTMLTableCellElement
}

export default abstract class InitiativeTableHandler{
    private static table : HTMLTableElement | null = null;
    private static caption : HTMLTableCaptionElement | null = null;
    private static thead : HTMLTableSectionElement | null = null;
    private static tbody : HTMLTableSectionElement | null = null;
    private static headRow : HTMLTableRowElement | null = null;
    private static readonly columns : InitiativeTableColumn[] = [
        {
            header : "Initiative", id : "initiative",
            create: InitiativeTableHandler.createInitiativeCell
        },
        {
            header : "Name", id : "name",
            create: InitiativeTableHandler.createNameCell
        },
        {
            header : "HP", id : "hit-points",
            create: InitiativeTableHandler.createHPCell
        },
        {
            header : "AC", id : "armor-class",
            create: InitiativeTableHandler.createACCell
        },
        {
            header : "Notes", id : "notes",
            create: InitiativeTableHandler.createNotesCell
        },
        {
            header : "Damage Type Modifiers", id : "damage-type-modifiers",
            create: InitiativeTableHandler.createDamageTypeModifierCell
        },
        {
            header : "Manage", id : "manage",
            create: InitiativeTableHandler.createManageCell
        }
    ];

    public static createTable() {
        // Try to find a table with the correct ID
        InitiativeTableHandler.table = document.querySelector("table#initiative-table");
        if(InitiativeTableHandler.table === null) throw "Unable to find initiative table!";

        // Create the necessary child elements for it
        InitiativeTableHandler.caption = document.createElement("caption");
        InitiativeTableHandler.caption.textContent = "Initiative Order";
        InitiativeTableHandler.thead = document.createElement("thead");
        InitiativeTableHandler.tbody = document.createElement("tbody");
        InitiativeTableHandler.headRow = document.createElement("tr");

        // Initialize the table head with all the headers
        for(const column of InitiativeTableHandler.columns) {
            let th : HTMLTableCellElement = document.createElement("th");
            th.classList.add(column.id + "-head");
            th.scope = "col";
            th.textContent = column.header;
            InitiativeTableHandler.headRow.appendChild(th);
        }
        InitiativeTableHandler.thead.appendChild(InitiativeTableHandler.headRow);

        // Append the caption, head, and body to the table
        InitiativeTableHandler.table.append(InitiativeTableHandler.caption, InitiativeTableHandler.thead, InitiativeTableHandler.tbody);

        InitiativeTableHandler.updateTable();
    }

    public static updateTable() {
        if(!InitiativeTableHandler.tbody) return;
        // Clear the table
        InitiativeTableHandler.tbody.innerHTML = "";
        // For each creature
        for(const creature of InitiativeOrder.getAllCreatures() || []) {
            // Create a new row in the tbody
            const row = InitiativeTableHandler.tbody.insertRow();
            // Add creature id to the row for easier access
            row.dataset.creatureId = creature.id.toString();
            // Add a class for styling based on the attitude
            if(creature.attitude == Attitude.Friendly) row.classList.add("attitude-friendly");
            if(creature.attitude == Attitude.Neutral) row.classList.add("attitude-neutral");
            if(creature.attitude == Attitude.Hostile) row.classList.add("attitude-hostile");
            // Add a class for the one with the current turn if it is their turn
            row.classList.toggle("current-turn", creature.isTurn);
            // If the creature is dead, add styling for it
            row.classList.toggle("creature-dead", creature.hit_points <= 0);
            // Populate it with cells for each column
            for(const column of InitiativeTableHandler.columns) {
                const cell = column.create(creature);
                cell.classList.add(column.id + "-cell");
                row.appendChild(cell);
            }
        }
        InitiativeOrder.saveToLocalStorage();
    }

    private static createAndAppendInput(cell : HTMLTableCellElement) : HTMLDivElement {
        // We use a contenteditable div since it is much easier to style
        let input = document.createElement("div");
        input.contentEditable = "true";
        input.classList.add("editable");
        cell.append(input);
        // Add a listener to focus the input when clicking within the cell
        cell.addEventListener("click", ()=>{
            input.focus();
        });
        return input;
    }

    private static createInitiativeCell(creature : InitiativeCreature) : HTMLTableCellElement {
        // Create the cell
        let cell = document.createElement("td");

        // Create a button for rolling initiative and append it to the cell
        let btn = document.createElement("button");
        btn.classList.add("cell-btn");
        btn.classList.add("creature-init-btn");
        btn.title = "Roll Initiative";
        btn.addEventListener("click", ()=>InitiativeOrder.rollInitiative(creature.id));
        // Add an image to the button
        let btnImg = document.createElement("img");
        btnImg.src = "./img/d20.svg";
        btn.append(btnImg);
        cell.append(btn);

        // Create an input for editing and append it to the cell
        let input = InitiativeTableHandler.createAndAppendInput(cell);
        input.inputMode = "numeric";
        
        // Event listener to update initiative based on input value
        input.addEventListener("input", (e)=>{
            if(!(e.target instanceof HTMLElement)) return;
            let c = InitiativeOrder.getCreature(creature.id);
            if(!c) return;
            c.initiative = +(e.target.textContent || Number.MIN_SAFE_INTEGER);
            InitiativeOrder.updateCreatureNoRefresh(creature.id, c);
        });
        input.addEventListener("keypress", (event) => {
            if (event.key == "Enter") event.preventDefault();
        });

        // If the creature has an initiative assigned to it
        if(creature.initiative > Number.MIN_SAFE_INTEGER) {
            // Set the value to that initiative
            input.textContent = creature.initiative.toString();
        }

        // Add a string to the dataset for use in CSS, used to show the initiative bonus
        cell.dataset.initiativeBonusString = "(+"+creature.initBonus.toString()+")";

        return cell;
    }

    private static createNameCell(creature : InitiativeCreature) : HTMLTableCellElement {
        // Create the cell
        let cell = document.createElement("td");

        // Create an input for editing and append it to the cell
        let input = InitiativeTableHandler.createAndAppendInput(cell);

        // Event listener to update name based on input value
        input.addEventListener("focusout", (e)=>{
            if(!(e.target instanceof HTMLElement)) return;
            let c = InitiativeOrder.getCreature(creature.id);
            if(!c) return;
            c.name = e.target.textContent || "";
            InitiativeOrder.updateCreatureNoRefresh(creature.id, c);
        });

        // Add event listeners for the input to search monsters
        input.addEventListener("input", MonsterDropdown.searchDropdownEdit);
        input.addEventListener("focusout", MonsterDropdown.searchDropdownRemove);
        input.addEventListener("change", MonsterDropdown.searchDropdownRemove);
        input.addEventListener("keypress", (event) => {
            if (event.key == "Enter") {
                event.preventDefault();
                MonsterDropdown.searchPickFirst();
            }
            MonsterDropdown.searchDropdownEdit(event);
        });

        input.textContent = creature.name;

        // If there is a statblock URL, add it
        if (creature.statBlockUrl) {
            let link = document.createElement("a");
            link.href = creature.statBlockUrl;
            link.classList.add("monster-link");
            link.target = "_blank";
            cell.prepend(link);
        }

        return cell;
    }

    private static createHPCell(creature : InitiativeCreature) : HTMLTableCellElement {
        // Create the cell
        let cell = document.createElement("td");

        // Create a button for rolling HP and append it to the cell
        if(creature.hit_dice) {
            let btn = document.createElement("button");
            btn.classList.add("cell-btn");
            btn.classList.add("creature-hp-btn");
            btn.title = "Roll HP";
            btn.addEventListener("click", ()=>InitiativeOrder.rollHP(creature.id));
            // Add an image to the button
            let btnImg = document.createElement("img");
            btnImg.src = "./img/d20.svg";
            btn.append(btnImg);
            cell.prepend(btn);
        }

        // Create an input for editing and append it to the cell
        let input = InitiativeTableHandler.createAndAppendInput(cell);
        input.inputMode = "numeric";
        
        // Event listener to update HP based on input value
        input.addEventListener("input", (e)=>{
            if(!(e.target instanceof HTMLElement)) return;
            let c = InitiativeOrder.getCreature(creature.id);
            if(!c) return;
            // Parse the new hitpoints with mathjs to allow for simple arithmetic on the HP
            const new_hit_points : number = mathFloor(mathEval(e.target.textContent || "NaN"));

            c.hit_points = new_hit_points;
            InitiativeOrder.updateCreatureNoRefresh(creature.id, c);
        });
        input.addEventListener("focusout", ()=>{
            InitiativeTableHandler.updateTable();
        });

        input.addEventListener("keypress", (event) => {
            if (event.key == "Enter") {
                event.preventDefault();
                InitiativeTableHandler.updateTable();
            }
        });

        // If the creature has an HP assigned to it
        if(!isNaN(creature.hit_points)) {
            // Set the value to that HP
            input.textContent = creature.hit_points.toString();
        }

        return cell;
    }

    private static createACCell(creature : InitiativeCreature) : HTMLTableCellElement {
        // Create the cell
        let cell = document.createElement("td");

        // Create an input for editing and append it to the cell
        let input = InitiativeTableHandler.createAndAppendInput(cell);
        input.inputMode = "numeric";
        
        // Event listener to update AC based on input value
        input.addEventListener("input", (e)=>{
            if(!(e.target instanceof HTMLElement)) return;
            let c = InitiativeOrder.getCreature(creature.id);
            if(!c) return;
            c.armor_class = +(e.target.textContent || Number.MIN_SAFE_INTEGER);
            InitiativeOrder.updateCreatureNoRefresh(creature.id, c);
        });
        input.addEventListener("keypress", (event) => {
            if (event.key == "Enter") event.preventDefault();
        });

        // If the creature has an AC assigned to it
        if(!isNaN(creature.armor_class)) {
            // Set the value to that AC
            input.textContent = creature.armor_class.toString();
        }

        return cell;
    }

    private static createNotesCell(creature : InitiativeCreature) : HTMLTableCellElement {
        // Create the cell
        let cell = document.createElement("td");

        // Create an input for editing and append it to the cell
        let input = InitiativeTableHandler.createAndAppendInput(cell);
        
        // Event listener to update notes based on input value
        input.addEventListener("input", (e)=>{
            if(!(e.target instanceof HTMLElement)) return;
            let c = InitiativeOrder.getCreature(creature.id);
            if(!c) return;
            c.notes = e.target.textContent || "";
            InitiativeOrder.updateCreatureNoRefresh(creature.id, c);
        });
        input.addEventListener("keypress", (event) => {
            if (event.key == "Enter") event.preventDefault();
        });

        input.textContent = creature.notes;

        return cell;
    }

    private static createDamageTypeModifierCell(creature : InitiativeCreature) : HTMLTableCellElement {
        // Create the cell
        let cell = document.createElement("td");

        for (let mod of creature.dmgTypeMod) {
            let img = document.createElement("div");
            img.classList.add("dmgtypemod");
            img.classList.add(mod.type);
            img.classList.add(mod.magical);
            img.classList.add(mod.modifier);
            img.classList.add(mod.adamantine);
            img.classList.add(mod.silvered);
            img.title = mod.desc;
            cell.appendChild(img);
        }

        return cell;
    }

    private static createManageCell(creature : InitiativeCreature) : HTMLTableCellElement {
        // Create the cell
        let cell = document.createElement("td");

        // Create a button for cloning and append it to the cell
        let cloneBtn = document.createElement("button");
        cloneBtn.classList.add("cell-btn");
        cloneBtn.classList.add("creature-clone-btn");
        cloneBtn.title = "Clone Creature";
        cloneBtn.addEventListener("click", ()=>InitiativeOrder.cloneCreature(creature.id));
        // Add an image to the button
        let cloneBtnImg = document.createElement("img");
        cloneBtnImg.src = "./img/clone.svg";
        cloneBtn.append(cloneBtnImg);
        cell.append(cloneBtn);

        // Create a button for cloning and append it to the cell
        let deleteBtn = document.createElement("button");
        deleteBtn.classList.add("cell-btn");
        deleteBtn.classList.add("creature-delete-btn");
        deleteBtn.title = "Delete Creature";
        deleteBtn.addEventListener("click", ()=>InitiativeOrder.removeCreature(creature.id));
        // Add an image to the button
        let deleteBtnImg = document.createElement("img");
        deleteBtnImg.src = "./img/trash.svg";
        deleteBtn.append(deleteBtnImg);
        cell.append(deleteBtn);

        return cell;
    }
}
