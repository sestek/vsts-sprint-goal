import { WidgetSettings, IWidgetConfigurationContext, IWidgetConfiguration, SaveStatus, WidgetStatus } from "TFS/Dashboards/WidgetContracts";
import { SprintGoalWidgetSettings } from "./settings";
import { SprintGoalApplicationInsightsWrapper } from "./SprintGoalApplicationInsightsWrapper";
import jscolor = require("jscolor-picker")

VSS.require(["TFS/Dashboards/WidgetHelpers"], function (WidgetHelpers) {
    WidgetHelpers.IncludeWidgetConfigurationStyles();
    var sprintGoalWidgetConfiguration = new SprintGoalWidgetConfiguration(WidgetHelpers, new SprintGoalApplicationInsightsWrapper());

    VSS.register("SprintGoalWidget.Configuration", () => sprintGoalWidgetConfiguration);
    VSS.notifyLoadSucceeded();
});


export class SprintGoalWidgetConfiguration implements IWidgetConfiguration {

    widgetSettings: WidgetSettings;
    constructor(public WidgetHelpers, private ai: SprintGoalApplicationInsightsWrapper) { }

    public async load(widgetSettings: WidgetSettings, widgetConfigurationContext: IWidgetConfigurationContext) : Promise<WidgetStatus> {
        try {
            this.widgetSettings = widgetSettings;
            var settings = JSON.parse(widgetSettings.customSettings.data) as SprintGoalWidgetSettings;
            settings = this.setDefaultColors(settings);

            $("#foreground-color-input").val(settings.foregroundColor);
            $("#background-color-input").val(settings.backgroundColor);
            $("#font-size-input").val(settings.fontsize);

            $("#foreground-color-input").on("change paste keyup", () => {
                if (this.validateNameTextInput($("#foreground-color-input"), $(".foreground-color-input-validation"))) {
                    this.notifyChange(widgetConfigurationContext);
                }
            });
            $("#background-color-input").on("change paste keyup", () => {
                if (this.validateNameTextInput($("#background-color-input"), $(".background-color-input-validation"))) {
                    this.notifyChange(widgetConfigurationContext);
                }
            });
            $("#font-size-input").on("change paste keyup", () => {
                if (this.validateNameTextInput($("#font-size-input"), $(".font-size-input-validation"))) {
                    this.notifyChange(widgetConfigurationContext);
                }
            });

            jscolor;
            window["jscolor"].installByClassName("jscolor"); 

            return this.WidgetHelpers.WidgetStatusHelper.Success();
        }
        catch (e) {
            await this.ai.trackException(e);
            return this.WidgetHelpers.WidgetStatusHelper.Failure(e.message); 
        }
    }

    public onSave = async () : Promise<SaveStatus> => {
        var customSettings = this.getCustomSettings();
        try {
            await this.ai.trackEvent("Save widget settings", {
                foregroundColor: <string>$("#foreground-color-input").val(),
                backgroundColor: <string>$("#background-color-input").val(),
                fontSize: <string>$("#font-size-input").val(),
                cols: this.widgetSettings.size.columnSpan.toString(),
                rows: this.widgetSettings.size.columnSpan.toString(),
                title: this.widgetSettings.name
            });
        }
        catch (e) {
            //swallow
        }
        return this.WidgetHelpers.WidgetConfigurationSave.Valid(customSettings);
    }

    private setDefaultColors = (settings: SprintGoalWidgetSettings) => {
        var defaultSettings = SprintGoalWidgetSettings.DefaultSettings;
        if (!settings)
            settings = defaultSettings

        if (!settings.foregroundColor) settings.foregroundColor = defaultSettings.foregroundColor;
        if (!settings.backgroundColor) settings.backgroundColor = defaultSettings.backgroundColor;
        if (!settings.fontsize) settings.fontsize = defaultSettings.fontsize;

        return settings;
    }

    private notifyChange = (widgetConfigurationContext: IWidgetConfigurationContext) => {
        widgetConfigurationContext.notify(this.WidgetHelpers.WidgetEvent.ConfigurationChange, this.WidgetHelpers.WidgetEvent.Args(this.getCustomSettings()));
    }

    private getCustomSettings = () => {
        var fontSize = parseInt(<string>$("#font-size-input").val());

        var customSettings = {
            data: JSON.stringify(new SprintGoalWidgetSettings(<string>$("#foreground-color-input").val(), <string>$("#background-color-input").val(), fontSize))
        };
        return customSettings;
    }


    private validateNameTextInput = ($nameInput, $errorSingleLineInput) => {
        if ($nameInput.val() == "") {
            $errorSingleLineInput.text("Please enter a value");
            $errorSingleLineInput.css("visibility", "visible");
            return;
        }
        $errorSingleLineInput.css("visibility", "hidden");
        return true;
    }
} 