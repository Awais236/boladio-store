import { Link } from 'react-router-dom';

export default function SizeGuidePage() {
  return (
    <div className="container">
      <div className="page-head" style={{ background: 'none', padding: '40px 0 20px', border: 'none' }}>
        <h1>Size Guide</h1>
        <p>Standard Pakistani women's sizing · measurements in inches</p>
      </div>
      <div style={{ maxWidth: 720, margin: '0 auto 80px' }}>
        <div className="size-guide checkout-card">
          <table>
            <thead><tr><th>Size</th><th>Bust</th><th>Waist</th><th>Hips</th></tr></thead>
            <tbody>
              <tr><td>XS</td><td>32</td><td>26</td><td>36</td></tr>
              <tr><td>S</td><td>34</td><td>28</td><td>38</td></tr>
              <tr><td>M</td><td>36</td><td>30</td><td>40</td></tr>
              <tr><td>L</td><td>38</td><td>32</td><td>42</td></tr>
              <tr><td>XL</td><td>40</td><td>34</td><td>44</td></tr>
              <tr><td>XXL</td><td>42</td><td>36</td><td>46</td></tr>
            </tbody>
          </table>
          <p className="dim small mt-16">
            Measure around the fullest part of your bust, the natural waist and the widest part of your
            hips. For unstitched pieces, order the quantity your tailor recommends for your size.
          </p>
        </div>
        <div className="center mt-24">
          <Link to="/contact" className="btn btn-dark">Still unsure? Ask us on WhatsApp</Link>
        </div>
      </div>
    </div>
  );
}