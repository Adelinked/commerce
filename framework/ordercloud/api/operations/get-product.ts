import type { OperationContext } from '@commerce/api/operations'
import type { GetProductOperation } from '@commerce/types/product'

import type { RawProduct, RawSpec, RawVariant } from '../../types/product'
import type { OrdercloudConfig, Provider } from '../index'

import { normalize as normalizeProduct } from '../../utils/product'

export default function getProductOperation({
  commerce,
}: OperationContext<Provider>) {
  async function getProduct<T extends GetProductOperation>({
    config,
    variables,
  }: {
    query?: string
    variables?: T['variables']
    config?: Partial<OrdercloudConfig>
    preview?: boolean
  } = {}): Promise<T['data']> {
    // Get fetch from the config
    const { storeRestFetch } = commerce.getConfig(config)

    // Get a single product
    const productPromise = storeRestFetch<RawProduct>(
      'GET',
      `/me/products/${variables?.slug}`
    )

    // Get product specs
    const specsPromise = storeRestFetch<{ Items: RawSpec[] }>(
      'GET',
      `/me/products/${variables?.slug}/specs`
    ).then((res) => res.Items)

    // Get product variants
    const variantsPromise = storeRestFetch<{ Items: RawVariant[] }>(
      'GET',
      `/me/products/${variables?.slug}/variants`
    ).then((res) => res.Items)

    // Execute all promises in parallel
    const [product, specs, variants] = await Promise.all([
      productPromise,
      specsPromise,
      variantsPromise,
    ])

    // Hydrate product
    product.xp.Specs = specs
    product.xp.Variants = variants

    return {
      // Normalize product to commerce schema
      product: normalizeProduct(product),
    }
  }

  return getProduct
}
