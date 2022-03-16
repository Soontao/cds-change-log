using {People} from './index.cds';

extend People with {
  @cds.changelog.enabled
  Weight : Double;
};
