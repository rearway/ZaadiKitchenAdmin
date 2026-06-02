import { useNavigate } from 'react-router-dom';

export default function RevenueDashboard() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* 5a. DARK HEADER — MRR BLOCK */}
      <div
        style={{
          backgroundColor: '#1A1A1A',
          padding: '32px',
          borderRadius: '16px',
          border: '1px solid #333',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
          <span
            style={{
              backgroundColor: '#333',
              color: '#FFF',
              padding: '4px 10px',
              borderRadius: '16px',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            Admin
          </span>
        </div>

        <div
          style={{
            color: '#9CA3AF',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '1px',
            marginBottom: '8px',
          }}
        >
          MONTHLY RECURRING REVENUE
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', marginBottom: '32px' }}>
          <h1
            style={{
              fontSize: '48px',
              fontFamily: 'Montserrat, sans-serif',
              margin: 0,
              lineHeight: 1,
            }}
          >
            SAR 54,200
          </h1>
          <div
            style={{
              backgroundColor: 'rgba(0, 200, 150, 0.15)',
              color: 'var(--err)',
              padding: '4px 12px',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '6px',
            }}
          >
            ↑ +12.4% vs last month
          </div>
        </div>

        {/* 3 Stat Tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <StatTile
            label="ACTIVE"
            value="248"
            onClick={() => navigate('/customers?filter=active')}
          />
          <StatTile
            label="NEW TODAY"
            value="14"
            color="var(--err)"
            onClick={() => navigate('/customers?filter=new')}
          />
          <StatTile
            label="CHURNED"
            value="3"
            color="var(--err)"
            onClick={() => navigate('/customers?filter=churned')}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* 5b. DAILY REVENUE BAR CHART */}
        <div
          style={{
            backgroundColor: '#1A1A1A',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid #333',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}
          >
            <h3 style={{ fontSize: '14px', color: '#9CA3AF', letterSpacing: '1px', margin: 0 }}>
              DAILY REVENUE
            </h3>
            <select
              style={{
                backgroundColor: '#222',
                color: '#FFF',
                border: '1px solid #333',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '13px',
              }}
            >
              <option>Apr 2025</option>
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '8px',
              height: '180px',
              paddingTop: '20px',
            }}
          >
            <BarChartCol day="Mon" height="40%" opacity={0.3} />
            <BarChartCol day="Tue" height="50%" opacity={0.3} />
            <BarChartCol day="Wed" height="45%" opacity={0.3} />
            <BarChartCol day="Thu" height="70%" opacity={1} today />
            <BarChartCol day="Fri" height="0%" opacity={0.1} />
            <BarChartCol day="Sat" height="0%" opacity={0.1} />
            <BarChartCol day="Sun" height="0%" opacity={0.1} />
          </div>
        </div>

        {/* 5c. SUBSCRIBERS BY PLAN */}
        <div
          style={{
            backgroundColor: '#1A1A1A',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid #333',
          }}
        >
          <h3
            style={{
              fontSize: '14px',
              color: '#9CA3AF',
              letterSpacing: '1px',
              margin: 0,
              marginBottom: '24px',
            }}
          >
            SUBSCRIBERS BY PLAN
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <HorizontalBar label="Month" count={129} width="52%" color="var(--err)" />
            <HorizontalBar label="Weekly" count={70} width="28%" color="var(--red)" />
            <HorizontalBar label="Quarterly" count={35} width="14%" color="var(--ops)" />
            <HorizontalBar label="Try It" count={14} width="6%" color="var(--err)" />
          </div>
        </div>
      </div>

      {/* 5d. KEY METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <div
          style={{
            backgroundColor: '#1A1A1A',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid #333',
          }}
        >
          <div
            style={{
              fontSize: '14px',
              color: '#9CA3AF',
              letterSpacing: '1px',
              marginBottom: '12px',
            }}
          >
            AVG SKIP RATE
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span
              style={{
                fontSize: '32px',
                fontFamily: 'Montserrat, sans-serif',
                color: 'var(--err)',
              }}
            >
              1.4
            </span>
            <span style={{ color: '#9CA3AF', fontSize: '14px' }}>↑ +0.2 vs last week</span>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#1A1A1A',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid #333',
          }}
        >
          <div
            style={{
              fontSize: '14px',
              color: '#9CA3AF',
              letterSpacing: '1px',
              marginBottom: '12px',
            }}
          >
            SALAD MEAL %
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <span
              style={{
                fontSize: '32px',
                fontFamily: 'Montserrat, sans-serif',
                color: 'var(--err)',
              }}
            >
              34%
            </span>
            <span style={{ color: '#9CA3AF', fontSize: '14px' }}>of active subs</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components

function StatTile({ label, value, color = '#FFF', onClick }: any) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#222',
        padding: '16px 20px',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2A2A2A')}
      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#222')}
    >
      <div style={{ fontSize: '12px', color: '#9CA3AF', letterSpacing: '1px', fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: '28px', fontFamily: 'Montserrat, sans-serif', color }}>{value}</div>
    </div>
  );
}

function BarChartCol({ day, height, opacity, today }: any) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        height: '100%',
      }}
    >
      <div
        style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '60%',
            height: height,
            backgroundColor: 'var(--err)',
            opacity,
            borderRadius: '4px 4px 0 0',
            minHeight: height === '0%' ? '2px' : height,
          }}
        />
      </div>
      <div
        style={{
          fontSize: '12px',
          color: today ? '#FFF' : '#9CA3AF',
          fontWeight: today ? 600 : 400,
          backgroundColor: today ? '#333' : 'transparent',
          padding: '2px 8px',
          borderRadius: '4px',
        }}
      >
        {day}
      </div>
    </div>
  );
}

function HorizontalBar({ label, count, width, color }: any) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate('/customers?plan=' + label.toLowerCase())}
      style={{ cursor: 'pointer' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '6px',
          fontSize: '14px',
        }}
      >
        <span style={{ color: '#E5E7EB' }}>{label}</span>
        <span style={{ fontWeight: 'bold' }}>{count}</span>
      </div>
      <div
        style={{ height: '8px', backgroundColor: '#222', borderRadius: '4px', overflow: 'hidden' }}
      >
        <div style={{ height: '100%', backgroundColor: color, width, borderRadius: '4px' }} />
      </div>
    </div>
  );
}
