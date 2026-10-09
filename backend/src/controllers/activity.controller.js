import { getProducts } from '../repositories/products.repository.js';
import { getRents } from '../repositories/rents.repository.js';
import { getOrders } from '../repositories/orders.repository.js';
import { getLostFound } from '../repositories/lostfound.repository.js';

export const getActivity = (req, res) => {
  try {
    const userId = req.user.id;
    const username = req.user.username;

    const products = getProducts();
    const rents = getRents();
    const orders = getOrders();
    const lostfound = getLostFound();

    const activities = [];

    // 1. Items listed to SELL by THIS user
    products
      .filter(p => p.sellerId === userId || (!p.sellerId && (p.seller === username || p.sellerUsername === username)))
      .forEach(p => {
        let statusLabel = 'Listed for Sale';
        if (p.status === 'sold') statusLabel = `🏷️ Sold to @${p.buyerUsername || 'buyer'}`;
        else if (p.status === 'pending') statusLabel = `⏳ Pending Request from @${p.pendingBuyerUsername}`;

        activities.push({
          id: 'act_prod_' + p.id,
          rawId: p.id,
          type: 'sell_listing',
          title: p.name,
          category: p.category,
          price: p.price,
          status: p.status,
          statusLabel,
          photo: p.photo,
          date: p.createdAt,
          canDelete: p.status === 'available',
          canApprove: p.status === 'pending',
          pendingBuyerId: p.pendingBuyerId,
          pendingBuyerUsername: p.pendingBuyerUsername,
          details: p.description,
          contact: p.contact,
          deleteEndpoint: '/api/products/' + p.id,
          approveEndpoint: '/api/products/' + p.id + '/approve-sale',
          rejectEndpoint: '/api/products/' + p.id + '/reject-sale',
        });
      });

    // 2. Items listed for RENT by THIS user
    rents
      .filter(r => r.ownerId === userId || (!r.ownerId && r.ownerUsername === username))
      .forEach(r => {
        let statusLabel = 'Listed for Rent';
        if (r.status === 'rented') statusLabel = `🔑 Rented to @${r.renterUsername || 'student'}`;
        else if (r.status === 'pending') statusLabel = `⏳ Pending Request from @${r.pendingRenterUsername}`;

        activities.push({
          id: 'act_rent_' + r.id,
          rawId: r.id,
          type: 'rent_listing',
          title: r.name,
          category: r.category,
          price: r.rentPerDay,
          priceUnit: '/day',
          status: r.status,
          statusLabel,
          photo: r.photo,
          date: r.createdAt,
          canDelete: r.status === 'available',
          canApprove: r.status === 'pending',
          pendingRenterId: r.pendingRenterId,
          pendingRenterUsername: r.pendingRenterUsername,
          details: r.description,
          contact: r.contact,
          deleteEndpoint: '/api/rents/' + r.id,
          approveEndpoint: '/api/rents/' + r.id + '/approve-rent',
          rejectEndpoint: '/api/rents/' + r.id + '/reject-rent',
        });
      });

    // 3. Items BOUGHT or RENTED by THIS user (orders)
    orders
      .filter(o => o.buyerId === userId)
      .forEach(o => {
        activities.push({
          id: 'act_ord_' + o.id,
          rawId: o.id,
          type: o.type === 'rent' ? 'rent_order' : 'buy_order',
          title: o.itemName,
          category: o.category,
          price: o.type === 'rent' ? o.totalAmount : o.price,
          status: 'completed',
          statusLabel: o.type === 'rent' ? `🤝 Rented from @${o.sellerUsername}` : `🛒 Bought from @${o.sellerUsername}`,
          photo: o.itemPhoto,
          date: o.createdAt,
          canDelete: false,
          canApprove: false,
          details: `Order #${o.id.slice(-6)} • Seller: @${o.sellerUsername} (${o.sellerContact || 'N/A'})`,
          contact: o.sellerContact,
        });
      });

    // 4. Pending buy requests sent by THIS user
    products
      .filter(p => p.pendingBuyerId === userId)
      .forEach(p => {
        activities.push({
          id: 'act_pending_buy_' + p.id,
          rawId: p.id,
          type: 'pending_buy',
          title: p.name,
          category: p.category,
          price: p.price,
          status: 'pending',
          statusLabel: `⏳ Awaiting approval from @${p.sellerUsername}`,
          photo: p.photo,
          date: new Date().toISOString(),
          canDelete: false,
          canApprove: false,
          details: `Your purchase request is pending seller review. Seller: @${p.sellerUsername}`,
          contact: p.contact,
        });
      });

    // 5. Pending rent requests sent by THIS user
    rents
      .filter(r => r.pendingRenterId === userId)
      .forEach(r => {
        activities.push({
          id: 'act_pending_rent_' + r.id,
          rawId: r.id,
          type: 'pending_rent',
          title: r.name,
          category: r.category,
          price: r.rentPerDay,
          priceUnit: '/day',
          status: 'pending',
          statusLabel: `⏳ Awaiting approval from @${r.ownerUsername}`,
          photo: r.photo,
          date: new Date().toISOString(),
          canDelete: false,
          canApprove: false,
          details: `Your rent request is pending owner review. Owner: @${r.ownerUsername}`,
          contact: r.contact,
        });
      });

    // 6. Lost & Found items reported by THIS user
    lostfound
      .filter(lf => lf.reportedById === userId || (!lf.reportedById && (lf.reportedBy === username || lf.reportedByUsername === username)))
      .forEach(lf => {
        activities.push({
          id: 'act_lf_' + lf.id,
          rawId: lf.id,
          type: 'lost_found_report',
          title: lf.name,
          category: lf.category,
          location: lf.location,
          status: lf.status,
          statusLabel: lf.status === 'claimed' ? 'Claimed by owner' : 'Reported in Lost & Found',
          photo: lf.photo,
          date: lf.createdAt,
          canDelete: true,
          canApprove: false,
          details: `Location: ${lf.location} • Date: ${lf.date}`,
          contact: lf.contact,
          deleteEndpoint: '/api/lostfound/' + lf.id,
        });
      });

    // Sort by timestamp (newest first)
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error('User activity error:', error);
    res.status(500).json({ message: 'Failed to retrieve user activity.' });
  }
};

