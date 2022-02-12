
import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import path, { join } from 'path';

const YAML_CONFIG_FILENAME = 'config.yaml';

const __dirname = path.resolve(path.dirname(""));

export default () => {
  return yaml.load(
    readFileSync(join(__dirname, "conf", YAML_CONFIG_FILENAME), 'utf8'),
  ) as Record<string, any>;
};
