import { crayon } from "https://deno.land/x/crayon@3.3.3/src/extensions/css_keywords.ts";
import { Canvas, Tui, handleInput, } from "../mod.ts";
import { Box, Table, TableHeader } from "../src/components/mod.ts"
import { KeyPressEvent } from "../src/input_reader/types.ts"

function generateRandomData(count: number): Model[] {
    const data = [];
    for (let i = 0; i < count; i++) {
        data.push(Model.from({
            Id: crypto.randomUUID(),
            Name: nameRandom(),
            Created: dateRandom()
        }));
    }
    return data;
}

const nameSemaphor = {value: 0};

function nameRandom() : string {
    const firstNames = ["Aiden", "Iona", "Connie", "Lachlan", "Lillian", "Karen", "Polly", "Saskia", "Tamara", "Brianna ", "Glenn", "Xavier", "Michael", "Darren", "Ryan", "Evangeline", "Christian", "Otis", "Steven", "Tyler",]
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Wilson", "Martinez", "Anderson", "Taylor", "Thomas", "Hernandez", "Moore", "Martin", "Jackson", "Thompson", "White"]
    let firstNameIndex = Math.floor(Math.random() * firstNames.length);
    if (nameSemaphor.value === firstNameIndex) { firstNameIndex = Math.random() * firstNames.length; }
    nameSemaphor.value = firstNameIndex;
    return `${firstNames[firstNameIndex]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`
}

function dateRandom () : string {
    return new Date(Date.now() - Math.floor(Math.random() * 86400 * 1000 * 30)).toDateString();
}

type Json = string | number | boolean | Json[] | { [key: string]: Json };

interface IModel {
    Id?: string;
    Name?: string;
    Created?: string;
}

export class Model {
    declare Id: string;
    declare Name: string;
    declare Created: Date;

    constructor() {
    }

    static from(obj: Json): Model {
        const graph = obj as IModel;
        const model = new Model();
        model.Id = graph.Id ? graph.Id : crypto.randomUUID();
        model.Name = graph.Name ? graph.Name : nameRandom();
        model.Created = graph.Created ? new Date(graph.Created) : new Date();
        return model;
    }
}

export class ControllerModel {
    declare Instances: Array<Model>;

    constructor() {
        this.Instances = [];
    }

    static from(obj: Array<Json> | Array<Model>): ControllerModel {
        const model = new ControllerModel();
        if (obj.length === 0) {
            return model;
        }
        if (obj[0] instanceof Model) {
            model.Instances = obj as Array<Model>;
        } else {
            model.Instances = (obj as Array<Json>).map((instance: Json) => Model.from(instance as Json));
        }
        return model;
    }

    public RemapInstances (): Array<Array<string>> {
        return this.Instances.map((instance: Model) => {
            return [instance.Id, instance.Name, instance.Created.toLocaleDateString()];
        });
    }

    public visibleColumns: Array<string> = ["Id", "Name", "Created"];

    public ResetVisibleColumns () {
        this.visibleColumns = ["Id", "Name", "Created"];
    }
}

export class ModelViewBase {
    defer (ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export class ModelSubtypeView extends ModelViewBase {
    app?: TheApp;
    box?: Box;
    table?: Table;
    headers: Array<TableHeader<false>> = [];
    controllerModel: ControllerModel;

    constructor(app: TheApp) {
        super();

        this.app = app;

        this.controllerModel = ControllerModel.from(generateRandomData(100));

        this.headers = this.controllerModel.visibleColumns.map((column: string) => {
            return { title: column }
        });

        this.box = new Box({
            parent: this.app.tui,
            rectangle: {
                column: 0,
                row: 0,
                width: this.app.tui.rectangle.value.width,
                height: this.app.tui.rectangle.value.height
            },
            theme: {
                base: crayon.bgDarkSlateGray
            },
            zIndex: 1
        });

        this.table = new Table({
            parent: this.box,
            headers: this.headers,
            data: this.controllerModel.RemapInstances(),
            rectangle: {
                column: 0,
                row: 0,
                height: this.box.rectangle.value.height
            },
            theme: {
                base: crayon.bgDarkSlateGray,
                frame: {},
                header: {},
                selectedRow: {}
            },
            zIndex: 2,
            charMap: 'rounded'
        });
    }

    Update () {
    }

    async dismiss () {
        await this.defer(100)
        this.destroy();
    }

    destroy () {
        this.box?.destroy();
        this.table?.destroy();
    }
}

export class TheApp {
    declare tui: Tui;
    declare model: ControllerModel;
    declare modelSubtypeView: ModelSubtypeView;

    constructor () {
        this.tui = new Tui({
            style: crayon.bgBlack.yellowGreen,
            refreshRate: 1000 / 60,
            canvas: new Canvas({
                stdout: Deno.stdout,
                size: {
                    columns: Deno.consoleSize().columns,
                    rows: Deno.consoleSize().rows,
                }
            })
        });
        this.model = new ControllerModel();
        this.modelSubtypeView = new ModelSubtypeView(this);

        handleInput(this.tui);
        this.tui.on('keyPress', this.handleKeyEvent.bind(this));
    }

    async handleKeyEvent (event: KeyPressEvent) {
        console.log(event.key.toLocaleLowerCase());
        if (event.key.toLocaleLowerCase() == "q" || event.key.toLocaleLowerCase() == "escape") {
            await this.modelSubtypeView.dismiss();
            this.Quit();
        }
        if (event.key.toLocaleLowerCase() == "r") {
            await this.modelSubtypeView.dismiss();
            await this.modelSubtypeView.defer(1000);
            this.modelSubtypeView = new ModelSubtypeView(this);
        }
    }

    async Update () {
        await this.modelSubtypeView.Update();
    }

    async Quit () {
        await this.tui.destroy();
        Deno.exit(0);
    }

    async Run () {
        await this.Update();
        this.tui.run();
    }
}

const app = new TheApp();
await app.Run();