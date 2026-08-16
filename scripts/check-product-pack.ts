import { catalog, modelCatalog, toolCatalog } from '../src/config/catalog';
import { homeConfig } from '../src/config/home';
import { productAgent } from '../src/config/product/agent';
import { productBrand } from '../src/config/product/brand';

console.log(
  [
    `Product Pack v${productBrand.schemaVersion} validated:`,
    `${productBrand.name},`,
    `agent=${productAgent.name},`,
    `homeSections=${homeConfig.sections.filter((section) => section.enabled).length},`,
    `tools=${toolCatalog.length},`,
    `models=${modelCatalog.length},`,
    `catalog=${catalog.length}`,
  ].join(' ')
);
