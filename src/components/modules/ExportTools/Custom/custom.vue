<template>
    <b-container fluid>
        <div class="col-lg-10 col-md-12 col-xs-12">
            <h1>{{ $t("Modules.ET.Custom.Title") }}</h1>
            <p>{{ $t("Modules.ET.Custom.Description") }}</p>
        </div>
        <br />

        <!-- Media type to export -->      
        <b-form-group id="etTypeGroup" v-bind:label="$t('Modules.ET.HSelectMedia')" label-size="lg" label-class="font-weight-bold pt-0">
            <b-tooltip target="etTypeGroup" triggers="hover">
                {{ $t('Modules.ET.TT-ETType') }}
            </b-tooltip>
            <b-form-radio-group
                id="mediaType"
                v-model="selMediaType"
                @change.native="changeType()"
                :options="optionsMediaType"
                name="mediaType">
            </b-form-radio-group>
        </b-form-group>

        <div> <!-- Select Custom Level -->    
            <b-form-group id="etLevelGroup" v-bind:label="$t('Modules.ET.Custom.CustomLevel')" label-size="lg" label-class="font-weight-bold pt-0">  
                <b-tooltip target="etLevelGroup" triggers="hover">
                    {{ $t('Modules.ET.TT-ETLevel') }}
                </b-tooltip>            
                <b-form-select
                    class="form-control"
                    :v-model="selCustLevel"
                    ref="selLevel"
                    id="selLevel"
                    v-on:change="selectExportLevel"                    
                    :options="optionsLevels"
                    name="selLevel">         
                </b-form-select>
            </b-form-group>     
        </div>

        <b-modal ref="showNewLevel" hide-footer v-bind:title=this.customTitle >
          <div class="d-block text-center">
              <b-form-input v-model="NewLevelName" v-bind:placeholder=this.NewLevelInputTxt ></b-form-input>            
          </div>
          <b-button class="mt-3" variant="outline-primary" block @click="addNewLevel">{{ this.NewLevelSaveTxt }}</b-button>
        </b-modal>

        <b-modal ref="confirmDeleteLevel" hide-footer v-bind:title=this.deleteLevel >
          <div class="d-block text-center">
              {{ $t('Modules.ET.Custom.confirmDelete', [this.selCustLevel]) }}              
          </div>
          <b-button class="mt-3" variant="info" block @click="deleteClose">{{ $t('Modules.ET.Custom.Cancel') }}</b-button>
          <b-button class="mt-3" variant="danger" block @click="deleteCustomLevel">{{ $t('Modules.ET.Custom.Delete') }}</b-button>
        </b-modal>

        <!-- Buttons -->
        <div id="buttons" class="text-center">
            <b-button-group >        
                <b-button variant="success" class="mr-1" @click="saveCustomLevel"> {{ $t('Modules.ET.Custom.btnSave') }} </b-button>
                <b-button variant="danger" class="mr-1" :disabled="this.btnDeleteEnabled == 0" @click="confirmDeleteLevel">{{ $t('Modules.ET.Custom.btnDelete') }}</b-button>
            </b-button-group>
        </div>

        <div class="row">
            <div class="col-md3">
                <div id="rowheader" class="font-weight-bold pt-0">
                    {{ $t('Modules.ET.Custom.availFields') }}                    
                </div>                
                <draggable class="list-group" :list="fieldList" group="fields">
                    <div class="list-group-item" v-for="(element) in fieldList" :key="element.name">
                        {{ element.name }}
                    </div>
                </draggable>
            </div>

            <div class="col-md3">
                <div id="rowheader" class="font-weight-bold pt-0">
                    {{ $t('Modules.ET.Custom.customFields') }}
                </div>
                <draggable class="list-group" :list="resultList" group="fields">
                    <div class="list-group-item" v-for="(element) in resultList" :key="element.name">
                        {{ element.name }}
                    </div>
                </draggable>
            </div>            
        </div>
                
    </b-container>    
</template>

<script>
  import { et } from "../scripts/et";  
  import i18n from '../../../../i18n';  
  import { wtconfig } from '../../General/wtutils';  
  import draggable from 'vuedraggable'
  
  const log = require("electron-log");  

  export default {
    components: {
        draggable,
    },
    data() {
        return {            
            selMediaType: "movie",
            optionsMediaType: [
                { text: i18n.t('Modules.ET.RadioMovies'), value: 'movie', disabled: false },            
                { text: i18n.t('Modules.ET.RadioTVSeries'), value: 'show', disabled: true }, 
                { text: i18n.t('Modules.ET.RadioTVEpisodes'), value: 'episode', disabled: false },
                { text: i18n.t('Modules.ET.RadioTVShowEpisodes'), value: 'showepisode', disabled: true },             
                { text: i18n.t('Modules.ET.RadioMusic'), value: 'artist', disabled: true },
                { text: i18n.t('Modules.ET.RadioPhotos'), value: 'photo', disabled: true },           
                { text: i18n.t('Modules.ET.RadioPlayLists'), value: 'playlist', disabled: true }                
            ],
            selCustLevel: "",
            deleteLevel: this.$t('Modules.ET.Custom.DeleteLevel'),
            customTitle: this.$t('Modules.ET.Custom.NewLevelTitle'),
            NewLevelInputTxt: this.$t('Modules.ET.Custom.NewLevelName'),
            NewLevelSaveTxt: this.$t('Modules.ET.Custom.NewLevelSaveTxt'),                        
            NewLevelName: '',                                           
            editable: true,
            isDragging: false,
            delayedDragging: false,
            fieldList: [],
            btnDeleteEnabled: false,
            optionsLevels: null,
            resultList: []

        }
    },
    watch: {
        isDragging(newValue) {
            if (newValue) {
                this.delayedDragging = true;
                return;
            }
            this.$nextTick(() => {
                this.delayedDragging = false;
            });
        }
    },
    computed: {
        dragOptions() {
            return {
                animation: 0,
                group: "description",
                disabled: !this.editable,
                ghostClass: "ghost"
            };
        },
        listString() {
            return JSON.stringify(this.list, null, 2);
        }
    },    
    mounted() {
        log.debug('Custom level page selected')
        // Populate combobox          
        this.genExportLevels();          
    },     
    methods: {
        getCustomLevel() {
            log.debug(`Customlevel ${this.selCustLevel} selected`);
            // Get fields from config.json file
            const custLevel = wtconfig.get(`ET.CustomLevels.${this.selMediaType}.level.${this.selCustLevel}`)
            // Add to resultList
            this.resultList = custLevel.map((name, index) => {
                    return { name, order: index + 1, fixed: false };
                });
            log.debug(`Custom level ${this.selCustLevel} is set as: ${ JSON.stringify(this.resultList) }`);
            // Now remove already added from avail fields
            for (var idx in custLevel){                
                for (var availidx in this.fieldList){
                    if (custLevel[idx] == this.fieldList[availidx].name)
                    {                        
                        this.fieldList.splice(availidx,1)                        
                    }
                }
            }
        },
        deleteClose() {
            this.$refs['confirmDeleteLevel'].hide();
            log.info('Delete aborted');
        },
        orderList() {
            this.list = this.list.sort((one, two) => {
            return one.order - two.order;
            });
        },
        onMove({ relatedContext, draggedContext }) {
        const relatedElement = relatedContext.element;
        const draggedElement = draggedContext.element;
        return (
            (!relatedElement || !relatedElement.fixed) && !draggedElement.fixed
        );
        },
        genExportLevels() {             
            et.getLevelDisplayName('My Level', this.selMediaType);
            // Returns valid levels for selected media type
            const etCustomLevel = et.getCustomLevels(this.selMediaType);                 
            const options = [];
            const item = {};
            let custLabel = {};
            custLabel['text']=this.$t('Modules.ET.Custom.CustomLevels');      
            custLabel['disabled']=true;
            custLabel['value']='';
            options.push(custLabel); 
            let newLabel = {}    
            newLabel['text']=this.$t('Modules.ET.Custom.NewCustomLevel');      
            newLabel['disabled']=false;
            newLabel['value']='NewLevel'; 
            options.push(newLabel); 
            Object.keys(etCustomLevel).forEach(function(key) {        
                let option = {}
                option['value'] = etCustomLevel[key];         
                if (key === "No Level Yet") {          
                option['text']=i18n.t('Modules.ET.NoLevelFound');          
                option['disabled'] = true;          
                } 
                else { option['text'] = key; }                       
                options.push(option);        
            });      
            item['options']=options;      
            this.optionsLevels = options;                                  
            this.fieldList = et.getAllFields( {libType: this.selMediaType});                        
        },        
        addNewLevel(){            
            // Hide Modal box
            this.$refs['showNewLevel'].hide();
            // Get current level names
            let curLevels = wtconfig.get(`ET.CustomLevels.${this.selMediaType}.levels`);
            // Add new level to JSON
            curLevels[this.NewLevelName] = this.NewLevelName;
            // Save
            wtconfig.set(`ET.CustomLevels.${this.selMediaType}.levels`, curLevels);
            // Get current level counts
            let curLevelCount = wtconfig.get(`ET.CustomLevels.${this.selMediaType}.LevelCount`);
            // Add new level to JSON
            curLevelCount[this.NewLevelName] = 0;
            // Save
            wtconfig.set(`ET.CustomLevels.${this.selMediaType}.LevelCount`, curLevelCount);
            // Get current level names
            let curLevel = wtconfig.get(`ET.CustomLevels.${this.selMediaType}.level`);
            // Add new level to JSON
            curLevel[this.NewLevelName] = [];
            // Save
            wtconfig.set(`ET.CustomLevels.${this.selMediaType}.level`, curLevel);
            // Update combobox
            this.genExportLevels();
            //this.exportLevels;            
            this.selCustLevel = this.NewLevelName;
            console.log ('Ged ********** above doesnt work ***********')
        },
        updateLevelCount() {            
            var def;
            // We need to load fields and defs into def var
            switch(this.selMediaType) {
                case 'movie':
                // code block
                def = JSON.parse(JSON.stringify(require('./../defs/def-Movie.json')));
                break;
                case 'episode':
                // code block
                def = JSON.parse(JSON.stringify(require('./../defs/def-Episode.json')));
                break;
                case 'show':
                    // code block
                    def = JSON.parse(JSON.stringify(require('./../defs/def-Show.json')));
                    break;
                case 'artist':
                    // code block
                    def = JSON.parse(JSON.stringify(require('./../defs/def-Artist.json')));
                    break;
                case 'photo':
                    // code block
                    def = JSON.parse(JSON.stringify(require('./../defs/def-Photo.json')));
                    break;
                default:
                // code block
            }            
            var fields = def[this.selMediaType]['fields'];
            // Release def memory again
            def = null;
            const levelFields = wtconfig.get(`ET.CustomLevels.${this.selMediaType}.level.${this.selCustLevel}`);
            let curLevel = 0;
            levelFields.forEach(function (item) {
                // Get field level
                var count = fields[item]['call'];
                if (count > curLevel)
                {
                    curLevel = count;
                }                
            });            
            log.info(`LevelCount for "${this.selCustLevel}" of the type "${this.selMediaType}" was calculated as:${curLevel}`);
            wtconfig.set(`ET.CustomLevels.${this.selMediaType}.LevelCount.${this.selCustLevel}`, curLevel);
        },
        changeType: function() {
            // Triggers when lib type is changed                        
            this.genExportLevels();
            this.btnDeleteEnabled = false; 
            this.resultList = [];           
        },
        deleteCustomLevel() {
            log.info(`User confirmed to delete custom level: ${this.selCustLevel}`);
            this.$refs['confirmDeleteLevel'].hide();            
            wtconfig.delete(`ET.CustomLevels.${this.selMediaType}.levels.${this.selCustLevel}`);
            wtconfig.delete(`ET.CustomLevels.${this.selMediaType}.LevelCount.${this.selCustLevel}`);
            wtconfig.delete(`ET.CustomLevels.${this.selMediaType}.level.${this.selCustLevel}`);
            this.genExportLevels();
            this.resultList = [];
        },
        saveCustomLevel() {            
            let result = []
            for(var k in this.resultList) {
                result.push(this.resultList[k].name);                
            }
            // Get current level names
            let curLevel = wtconfig.get(`ET.CustomLevels.${this.selMediaType}.level`);            
            // Add new level to JSON            
            curLevel[this.selCustLevel] = result;   
            log.info(`Saving custom level ${this.selCustLevel} as ${JSON.stringify(result)}`)                     
            wtconfig.set(`ET.CustomLevels.${this.selMediaType}.level`, curLevel); 
            // Now we need to update levelcount for the level
            this.updateLevelCount();            
        },
        confirmDeleteLevel() {
            log.info(`User asked to delete a custom level`);
            this.$refs['confirmDeleteLevel'].show();
        },
        selectExportLevel: function(value) {      
            log.info(`Custom ExportLevel selected as: ${value}`)
            if ( value == 'NewLevel') {
                // Create new level                
                this.$refs['showNewLevel'].show();                
            }
            else {                
                this.btnDeleteEnabled = true;
                this.selCustLevel = value;
            }
            this.resultList = [];
            this.genExportLevels();
            this.getCustomLevel();
        }
      }
    };  
</script>


<style scoped>
#rowheader{
    margin-left: 25px;    
    margin-bottom: 10px;
}
.list-group{    
    width: 350px;
    height: 250px;
    margin-bottom: 10px;
    overflow:scroll;
    /* -webkit-overflow-scrolling: touch; */
    margin-right: 10px;
    margin-left: 10px;
}

.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}
.list-group {
  min-height: 20px;
}

.list-group-item {
  cursor: move;
}
.list-group-item i {
  cursor: pointer;
}

#buttons {    
    width: auto;
    margin-top: 5px;
    margin-bottom: 15px;
}

</style>