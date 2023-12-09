import DiceBox from "@3d-dice/dice-box-threejs";

export default abstract class DiceRoller {
    private static dicebox : any = null;
    private static diceClearTimeout : number = NaN;

    public static async init() {
        DiceRoller.dicebox = new DiceBox("#dicebox", {
            sounds: true
        });
        await DiceRoller.dicebox.initialize();
    }

    public static async roll(dice : string | string[]) {
        console.log(dice);
        if(DiceRoller.dicebox === null) await DiceRoller.init();
        let boxElem = (document.querySelector("#dicebox") as HTMLElement);
        return new Promise<void>(async (resolve, reject) => {
            window.setTimeout(resolve, 5000);
            boxElem.style.opacity = "1";
            await DiceRoller.dicebox.roll(dice);
            window.clearTimeout(DiceRoller.diceClearTimeout);
            DiceRoller.diceClearTimeout = window.setTimeout(()=>boxElem.style.opacity = "0", 1000);
            resolve();
        });
    }
}
